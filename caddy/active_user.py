#!/usr/bin/python3 -u
#-*- coding: utf-8 -*-

"""
# pip3 install geoip2 --break-system-packages
https://github.com/maxmind/GeoIP2-python
"""

import os
import sys
import time
import json
import datetime
import urllib.parse
import hashlib
import hmac
import base64
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

def split_keys(master_key: bytes):
    """
    Replicates:
      list($encKey, $authKey) = self::splitKeys($masterKey);
      return [
          hash_hmac(self::HASH_ALGO, 'ENCRYPTION', $masterKey, true),
          hash_hmac(self::HASH_ALGO, 'AUTHENTICATION', $masterKey, true)
      ];
    """
    enc_key = hmac.new(master_key, b"ENCRYPTION", hashlib.sha256).digest()
    auth_key = hmac.new(master_key, b"AUTHENTICATION", hashlib.sha256).digest()
    return enc_key, auth_key


def unsafe_decrypt(ciphertext: bytes, key: bytes) -> bytes:
    """
    Replicates UnsafeCrypto::decrypt() for AES-256-CTR:
      - First 16 bytes is the nonce (IV)
      - The rest is the raw ciphertext
      - Use AES-256-CTR to decrypt
    """
    nonce_size = 16  # For AES-256-CTR (128-bit nonce)
    nonce = ciphertext[:nonce_size]
    actual_ciphertext = ciphertext[nonce_size:]

    cipher = Cipher(
        algorithms.AES(key),
        modes.CTR(nonce),
        backend=default_backend()
    )
    decryptor = cipher.decryptor()
    plaintext = decryptor.update(actual_ciphertext) + decryptor.finalize()

    return plaintext


def nice_decrypt(ciphertext_b64: str, secret_key: str) -> str | None:
    """
    Equivalent of PHP's nice_decrypt($str).

    Steps performed (mirroring SaferCrypto::decrypt):
      1. Base64-decode the input
      2. Split off the MAC (first 32 bytes) and the rest is the IV+ciphertext
      3. Recompute HMAC-SHA256 over the IV+ciphertext and compare with the MAC
      4. If they match, proceed with UnsafeCrypto::decrypt (AES-256-CTR)
      5. Return plaintext as a UTF-8 string; on error, return None
    """
    # 1. Base64-decode
    secret_key = secret_key.encode()
    raw_data = base64.b64decode(ciphertext_b64)

    # 2. The first 32 bytes is the HMAC (since HASH_ALGO=sha256 => 32 bytes)
    mac_size = 32
    mac = raw_data[:mac_size]
    encrypted_part = raw_data[mac_size:]

    enc_key, auth_key = split_keys(secret_key)

    computed_mac = hmac.new(auth_key, encrypted_part, hashlib.sha256).digest()
    if not hmac.compare_digest(mac, computed_mac):
    # 3. MAC does not match => tampering or wrong key
        return -1

    # 4. Now decrypt with the encryption key
    plaintext_bytes = unsafe_decrypt(encrypted_part, enc_key)

    # 5. Convert to UTF-8 string (assuming original data was text)
    return plaintext_bytes.decode('utf-8')

def reverse_readline(filename, buf_size=8192):
    """
    A generator that returns the lines of a file in reverse order
    """
    with open(filename, 'rb') as fh:
        segment = None
        offset = 0
        fh.seek(0, os.SEEK_END)
        file_size = remaining_size = fh.tell()
        while remaining_size > 0:
            offset = min(file_size, offset + buf_size)
            fh.seek(file_size - offset)
            buffer = fh.read(min(remaining_size, buf_size))
            # remove file's last "\n" if it exists, only for the first buffer
            if remaining_size == file_size and buffer[-1] == ord('\n'):
                buffer = buffer[:-1]
            remaining_size -= buf_size
            lines = buffer.split('\n'.encode())
            # append last chunk's segment to this chunk's last line
            if segment is not None:
                lines[-1] += segment
            segment = lines[0]
            lines = lines[1:]
            # yield lines in this chunk except the segment
            for line in reversed(lines):
                # only decode on a parsed line, to avoid utf-8 decode error
                yield line.decode()
        # Don't yield None if the file was empty
        if segment is not None:
            yield segment.decode()


if __name__ == "__main__":

    result = {}
    for line in reverse_readline(sys.argv[1], 10240):

        if not line.strip():
            continue

        try:
            log = json.loads(line.strip())
        except:
            continue

        ##### Parse Traffic
        ts = log['ts']
        if time.time() - ts >= 600: break

        ts = datetime.datetime.fromtimestamp(ts)
        ip = log['request']['headers'].get('Cf-Connecting-Ip', [''])[0]
        ip_country = None
        if ip:
            ip_country = log['request']['headers'].get('Cf-Ipcountry', [''])[0]

        ua = log['request']['headers'].get('User-Agent', [''])[0]
        ref = log['request']['headers'].get('Referer', [''])[0]
        lang = log['request']['headers'].get('Accept-Language', [''])[0]
        host = log['request']['headers'].get('Host', [''])[0]
        uri = log['request']['uri']
        host = log['request']['host']
        method = log['request']['method']
        status = log['status']

        print(ip, uri, len(result))
        if ip not in result:
            result[ip] = {}

        if uri.startswith("/mysekai/data/"): continue
        if "facebookexternalhit/1.1" in ua: continue

        ##### PROFILE MODE
        profile_data = ""
        profile_id = -1
        rank_id = -1

        if not uri.startswith("/api?type=profile"): continue
        if "&rank_id=" in uri:
            try:
                profile_id = urllib.parse.unquote(uri.split("&rank_id=")[0].split("=")[-1])
                date = str(ts).split(" ")[0]
                secret_key = hashlib.md5(("airi_an_random_useragent_kohane_haruka").encode()).hexdigest()
                profile_data = nice_decrypt(profile_id, secret_key).split("exp=")[1]
                rank_id = uri.split("&rank_id=")[1].split("&")[0]
                if profile_data:
                    result[ip][str(profile_data)] = rank_id
            except Exception as e:
                pass

    # TODO: Keeping absolute path
    f = open("/mnt/external/sekai/web/data/active_user.txt", "w")
    f.write(str(len(result)) + "\n")
    f.write(json.dumps(result))
    f.close()
