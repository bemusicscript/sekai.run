import os
import re
import traceback

from io import BytesIO
from io import RawIOBase
from struct import *
from typing import Callable
from datetime import datetime

import requests
import UnityPy
import pdb
from redis import Redis
from packaging.version import Version

UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.21f1"

r = requests.Session()
log = open("update_apphash.log", "w+")

def now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def offset_decorate(func: Callable) -> Callable:
    def func_wrapper(*args, **kwargs) -> Callable:
        offset = kwargs.get('offset')
        if offset is not None:
            back = args[0].base_stream.tell()
            args[0].base_stream.seek(offset)
            d = func(*args)
            args[0].base_stream.seek(back)
            return d
        return func(*args, **kwargs)

    return func_wrapper


class BinaryStream:
    def __init__(self, base_stream: RawIOBase, endian='little'):
        self.base_stream = base_stream
        self.endian = endian

    def readByte(self) -> bytes:
        return self.base_stream.read(1)

    @offset_decorate
    def readBytes(self, length: int) -> bytes:
        return self.base_stream.read(length)

    def readChar(self) -> int:
        return self.unpack('b')

    def readUChar(self) -> int:
        return self.unpack('B')

    def readBool(self) -> bool:
        return self.unpack('?')

    def readInt16(self) -> int:
        return self.unpack('>h', 2) if self.endian == "big" else self.unpack('h', 2)

    def readUInt16(self) -> int:
        if (self.endian == 'big'):
            return self.unpack('>H', 2)
        return self.unpack('H', 2)

    def readInt32(self) -> int:
        if (self.endian == 'big'):
            return self.unpack('>i', 4)
        return self.unpack('i', 4)

    def readUInt32(self) -> int:
        if (self.endian == 'big'):
            return self.unpack('>I', 4)
        return self.unpack('I', 4)

    def readInt64(self) -> int:
        if (self.endian == 'big'):
            return self.unpack('>q', 8)
        return self.unpack('q', 8)

    def readUInt64(self) -> int:
        if (self.endian == 'big'):
            return self.unpack('>Q', 8)
        return self.unpack('Q', 8)

    def readFloat(self) -> float:
        return self.unpack('f', 4)

    def readDouble(self) -> float:
        return self.unpack('d', 8)

    def readString(self) -> bytes:
        length = self.readUInt16()
        return self.unpack(str(length) + 's', length)

    @offset_decorate
    def readStringLength(self, length: int) -> bytes:
        return self.unpack(str(length) + 's', length)

    @offset_decorate
    def readStringToNull(self) -> bytes:
        byte_str = b''
        while 1:
            b = self.readByte()
            if (b == b'\x00'):
                break
            byte_str += b
        return byte_str

    def AlignStream(self, alignment=4):
        pos = self.base_stream.tell()
        if ((pos % alignment) != 0):
            self.base_stream.seek(alignment - (pos % alignment), 1)

    def writeBytes(self, value: bytes):
        self.base_stream.write(value)

    def writeChar(self, value: str):
        self.pack('c', value)

    def writeUChar(self, value: str):
        self.pack('C', value)

    def writeBool(self, value: bool):
        self.pack('?', value)

    def writeInt16(self, value: int):
        self.pack('h', value)

    def writeUInt16(self, value: int):
        self.pack('H', value)

    def writeInt32(self, value: int):
        self.pack('i', value)

    def writeUInt32(self, value: int):
        self.pack('I', value)

    def writeInt64(self, value: int):
        self.pack('q', value)

    def writeUInt64(self, value: int):
        self.pack('Q', value)

    def writeFloat(self, value: float):
        self.pack('f', value)

    def writeDouble(self, value: float):
        self.pack('d', value)

    def writeString(self, value: str):
        length = len(value)
        self.writeUInt16(length)
        self.pack(str(length) + 's', value)

    def pack(self, fmt: str, data) -> bytes:
        return self.writeBytes(pack(fmt, data))

    def unpack(self, fmt: str, length=1) -> tuple:
        return unpack(fmt, self.readBytes(length))[0]

    def unpack_raw(self, fmt: str) -> tuple:
        length = Struct(fmt).size
        return unpack(fmt, self.readBytes(length))


def read_app_hash(path_to_apk):
    env = UnityPy.load(os.path.join(os.getcwd(), path_to_apk))
    strings = []
    names = [
        'memo', 'clientMajorVersion', 'clientMinorVersion',
        'clientBuildVersion', 'snapshot', 'clientVersionSuffix',
        'clientDataMajorVersion', 'clientDataMinorVersion',
        'clientDataBuildVersion', 'clientDataRevision', 'companyName',
        'productName', 'bundleIdentifier', 'bundleVersion', 'assetHash',
        'clientAppHash', 'bundleVersionCode'
    ]

    for obj in env.objects:
        if obj.type.name == 'ResourceManager':
            target_object = None
            readObj = obj.read()
            for container in readObj.m_Container:
                if container[0] == "playersettings/android/production_android":
                    target_object = container[1]
                    break

            if not target_object:
                continue

            target_object_start = int(target_object.deref().byte_start / 4)
            target_object_raw = target_object.deref().get_raw_data()
            target_object_raw_real = target_object_raw[target_object_start:]

            bs = BinaryStream(BytesIO(target_object_raw_real))
            while bs.base_stream.tell() < len(target_object_raw_real) - 4:
                strLen = bs.readUInt32()
                strings.append(bs.readStringLength(strLen).decode('utf-8'))
                bs.AlignStream()

    app_hash_dict = dict(zip(names, strings))
    return app_hash_dict

def get_apkcombo_download_link():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://apkcombo.com/ko/project-sekai/com.sega.pjsekai/"
    }

    req = r.get("https://apkcombo.com/checkin", headers=headers)
    resp = req.text

    req = r.get("https://apkcombo.com/ko/project-sekai/com.sega.pjsekai/download/apk", headers=headers)
    resp = req.text

    patterns = [
        ['https://download.apkcombo.com/', r'<a href="https://download.apkcombo.com/(.+)" class="variant" rel="nofollow noreferrer">'],
        ['https://download.apkcombo.app/', r'<a href="https://download.apkcombo.app/(.+)" class="variant" rel="nofollow noreferrer">'],
        ['https://apkcombo.com/r2?', r'<a href="/r2\?(.+)" class="variant" rel="nofollow noreferrer">'],
    ]

    for host, pattern in patterns:
        try:
            download_urls = re.findall(pattern, resp)
            # print(download_url)

            for download_url in download_urls:
                if ".xapk" not in download_url:
                    continue

                log.write(f"[{now()}] Download URL: {download_url}\n")
                req = r.get("https://apkcombo.com/checkin", headers=headers)
                resp = req.text
                download_url += f"&{resp}"
                print(">>>", download_url)

                log.write(f"[{now()}] Final Download URL: {host}{download_url}\n")
                return host + download_url
        except:
            pass
    return None


def download_apkpure(url, filename):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://apkpure.com/kr/hatsune-miku-colorful-stage-2024/com.sega.pjsekai",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "Dnt": "1",
        "Pragma": "no-cache",
        "priority": "u=0, i",
        "sec-ch-ua": '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "macOS",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-site",
        "sec-fetch-user": "?1",
        "sec-gpc": "1",
        "upgrade-insecure-requests": "1"
    }
    req = r.get(url, headers=headers)
    log.write(f"[{now()}] APKPure Download Status: {req.headers}\n")
    with open(filename, "wb") as fp:
        fp.write(req.content)
    return True

def download_apkcombo(url, filename):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://apkcombo.com/ko/project-sekai/com.sega.pjsekai/download/apk",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "Dnt": "1",
        "Pragma": "no-cache",
        "priority": "u=0, i",
        "sec-ch-ua": '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "macOS",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-site",
        "sec-fetch-user": "?1",
        "sec-gpc": "1",
        "upgrade-insecure-requests": "1"
    }

    req = r.get(url, headers=headers)
    log.write(f"[{now()}] Download Status: {req.headers}\n")
    with open(filename, "wb") as fp:
        fp.write(req.content)
    return True

if __name__ == "__main__":

    # Initialize Redis
    redis = Redis(
        host="valkey.internal",
        port=6379,
        username="default",
        password="redacted",
        db=0
    )
    log.write(f"[{now()}] Redis: {redis}\n")
    log.write(f"[{now()}] Start...\n")

    # Filenames
    filename_apkcombo = "downloads/proseka_apkcombo.apk"
    filename_apkpure = "downloads/proseka_apkpure.apk"

    # Download from APKCombo
    try:
        log.write(f"[{now()}] Download File from APKCombo...\n")
        download_link = get_apkcombo_download_link()
        log.write(f"[{now()}] Download Link from APKCombo: {download_link}\n")
        app_file = download_apkcombo(download_link, filename_apkcombo)
    except Exception as e:
        log.write(f"{traceback.format_exc()}\n")
        log.write(f"[{now()}] Download Failed for APKCombo\n")

    # Download from APKPure
    try:
        download_link = "https://d.apkpure.net/b/XAPK/com.sega.pjsekai?version=latest"
        log.write(f"[{now()}] Download Link from APKPure: {download_link}\n")
        app_file = download_apkpure(download_link, filename_apkpure)
    except Exception as e:
        log.write(f"{traceback.format_exc()}\n")
        log.write(f"[{now()}] Download Failed for APKPure\n")

    log.write(f"[{now()}] Reading App Hash...\n")

    app_info_apkcombo = {}
    try:
        app_info_apkcombo = read_app_hash(filename_apkcombo)
    except Exception as e:
        log.write(f"{traceback.format_exc()}\n")
        log.write(f"[{now()}] Appinfo Parse Failed for APKCombo\n")
    finally:
        log.write(f"[{now()}] APKCombo: {app_info_apkcombo}\n")

    app_info_apkpure = {}
    try:
        app_info_apkpure = read_app_hash(filename_apkpure)
    except Exception as e:
        log.write(f"{traceback.format_exc()}\n")
        log.write(f"[{now()}] Appinfo Parse Failed for APKPure\n")
    finally:
        log.write(f"[{now()}] APKPure: {app_info_apkpure}\n")
    log.write(f"[{now()}] Read App Hashes Done...\n")

    app_info = {}
    if (Version(app_info_apkcombo.get('bundleVersion', '0.0.0')) >=
        Version(app_info_apkpure.get('bundleVersion', '0.0.0'))):
        app_info = app_info_apkcombo
    else:
        app_info = app_info_apkpure

    log.write(f"[{now()}] Decision: {app_info}\n")
    app_version = app_info['bundleVersion']
    app_hash = app_info['clientAppHash']
    log.write(f"[{now()}] Bundle Version: {app_version}\n")
    log.write(f"[{now()}] App Hash: {app_hash}\n")

    print(app_version, "/", app_hash)
    app_hash_result = redis.set("PROSEKA_APP_HASH", app_hash)
    app_version_result = redis.set("PROSEKA_APP_VERSION", app_version)

    log.write(f"[{now()}] App Hash Redis Result: {app_hash_result}\n")
    log.write(f"[{now()}] App Version Redis Result: {app_version_result}\n")
    print(app_hash_result, app_version_result)

