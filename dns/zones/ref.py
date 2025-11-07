import os
import json
import dns.resolver
import socket
from pythonping import ping
from collections import Counter

## Configs

SERVERS = {
    'production-game-api.sekai.colorfulpalette.org',
    'game-version.sekai.colorfulpalette.org',
    'issue.sekai.colorfulpalette.org',
    'sekai.colorfulpalette.org',
    'sstate.sekai.colorfulpalette.org',
}
ZONE_ROOT = 'sekai.colorfulpalette.org'
FASTEST_COUNT = 2

RESOLVER_SETS = [
    ['1.1.1.1', '1.0.0.1'],
    ['8.8.8.8', '8.8.4.4'],
    ['9.9.9.9', '149.112.112.112'],
    ['168.126.63.1', '168.126.63.2'],  # KT (KR)
    [socket.gethostbyname('dns.nifty.com'), socket.gethostbyname('dns5.nifty.com')],  # Nifty (JP)
]

## Functions

def resolve_dns_records(server, record_type, resolver):
    try:
        answers = resolver.resolve(server, record_type)
        return [r.to_text() for r in answers]
    except Exception:
        return []

def ping_addresses(addresses):
    results = {}
    for address in addresses:
        try:
            response = ping(address, count=4)
            times = [r.time_elapsed_ms for r in response if r.success]
            if times:
                results[address] = min(times)
        except Exception:
            continue
    return results

def format_soa(soa_str):
    parts = soa_str.split()
    return (
        f"@\t60\tIN\tSOA\t{parts[0]}\t{parts[1]}\t(\n"
        f"\t{parts[2]}\n"
        f"\t{parts[3]}\n"
        f"\t{parts[4]}\n"
        f"\t{parts[5]}\n"
        f"\t{parts[6]}\n"
        f")"
    )

## Main

resolver = dns.resolver.Resolver()
results = {}

for server in SERVERS:
    results[server] = {'A': [], 'CNAME': [], 'NS': [], 'SOA': []}

    for resolver_set in RESOLVER_SETS:
        resolver.nameservers = resolver_set

        if server == ZONE_ROOT:
            results[server]['SOA'].extend(resolve_dns_records(server, 'SOA', resolver))
            results[server]['NS'].extend(resolve_dns_records(server, 'NS', resolver))
        else:
            results[server]['CNAME'].extend(resolve_dns_records(server, 'CNAME', resolver))
            results[server]['A'].extend(resolve_dns_records(server, 'A', resolver))

    if server == ZONE_ROOT:
        results[server]['SOA'] = Counter(results[server]['SOA']).most_common(1)[0][0]
        results[server]['NS'] = [ns for ns, _ in Counter(results[server]['NS']).most_common(4)]
    else:
        results[server]['CNAME'] = Counter(results[server]['CNAME']).most_common(1)[0][0] if results[server]['CNAME'] else ""
        unique_a_records = list(set(results[server]['A']))
        ping_results = ping_addresses(unique_a_records)
        # print(ping_results)
        fastest = sorted(ping_results.items(), key=lambda item: item[1])[:FASTEST_COUNT]
        # print(fastest)
        results[server]['A'] = [ip for ip, _ in fastest]

# Output JSON result (for debugging)
# print(json.dumps(results, indent=4))

# Write bind9 zone file
zone_lines = [
    'local-zone: "sekai.colorfulpalette.org." nodefault'
]

for domain, info in results.items():
    if domain == ZONE_ROOT:
        continue
    for ip in info['A']:
        zone_lines.append(f'local-data: "{domain}. 60 IN A {ip}"')

# Clean and write to file
final_zone = '\n'.join(line.strip() for line in zone_lines)
final_zone += '\n'
print(final_zone)

with open("sekai.conf", "w") as f:
    f.write(final_zone)

print(os.popen("docker exec -it dns unbound-control reload").read())
