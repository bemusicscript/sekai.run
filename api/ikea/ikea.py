import os
import sys
import requests
import hashlib
import glob
import json

MYSEKAI_DATA_PATH = "../app/api/downloads/mysekai/"
BLOCK_CACHE_FILE = "./data/list_block.txt"
USER_CACHE_FILE = "./data/user_cached.json"
USER_FILE = "./data/list_user.txt"
skip_check = False
skip_all = False
users_cache = {}

# Utility functions
def read_file(filepath):
    if os.path.exists(filepath):
        with open(filepath, "r") as file:
            return [line.strip() for line in file if line.strip()]
    return []

def write_file(filepath, content):
    with open(filepath, "w") as file:
        file.write(content)

def fetch_json(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching data from {url}: {e}")
        return {}

# API functions
def get_profile(uid):
    return fetch_json(f"http://api.internal:5000/profile/{uid}")

def get_mysekai_entry(uid):
    return fetch_json(f"http://api.internal:5000/mysekai/{uid}")

def get_fixtures():
    return fetch_json("http://api.internal:5000/json/mysekaiFixtures.json")

def get_genres():
    return {
        "main": fetch_json("http://api.internal:5000/json/mysekaiFixtureMainGenres.json"),
        "sub": fetch_json("http://api.internal:5000/json/mysekaiFixtureSubGenres.json"),
    }

def get_sketch_list(fixtures):
    # Fetch from blueprints and fixtures, and make some comparison here
    blueprints = fetch_json("http://api.internal:5000/json/mysekaiBlueprints.json")
    blueprints_hashmap = {}
    for blueprint in blueprints:
        blueprints_hashmap[blueprint['id']] = blueprint['isEnableSketch']

    fixtures = fixtures['id']
    result = {}

    for item_id, item in fixtures.items():
        try:
            result[item['id']] = blueprints_hashmap[item['id']]
        except:
            result[item['id']] = False
    return result

    '''
    for item in blueprints:
        result[item['id']] = item['isEnableSketch']
    return result
    '''

# Block cache management
def read_block_cache():
    return read_file(BLOCK_CACHE_FILE)

def write_block_cache(block_list):
    write_file(BLOCK_CACHE_FILE, ("\n".join(block_list)))

# Profile checking
def validate_profiles(uid_list):
    global users_cache, skip_check
    block_cache = read_block_cache()
    valid_uids = []

    for uid in uid_list:
        print(f"- Checking {uid}...")

        if skip_all:
            valid_uids.append(uid)
            continue

        if uid not in users_cache:
            profile_info = get_profile(uid)
            # We keep this as true because sometimes there are maintenance etc.
            users_cache[uid] = profile_info.get("isMysekaiOwnerAcceptVisit", True)

        if users_cache[uid]:
            valid_uids.append(uid)
        else:
            print(f"{uid} seems inactive...")
            if users_cache[uid] == False:
                if uid not in block_cache:
                    block_cache.append(uid)

    write_block_cache(block_cache)
    return valid_uids

# Fixture processing
def process_fixtures():
    fixtures_paths = glob.glob(os.path.join(MYSEKAI_DATA_PATH, "**/*.webp"), recursive=True)
    genres = get_genres()

    genre_main = {genre['id']: genre['name'] for genre in genres['main']}
    genre_sub = {genre['id']: genre['name'] for genre in genres['sub']}

    fixtures = {}
    fixtures_hashmap = {}

    for fixture in get_fixtures():
        fixture_id = fixture['id']
        bundle_name = fixture['assetbundleName']

        # Some exceptions for asset searches
        if fixture['mysekaiFixtureType'] == "plant":
            bundle_name = f"{fixture['assetbundleName']}_{fixture_id}"
            # bundle_name = f"mdl_non1001_before_sapling1_{fixture_id}"
        elif fixture['mysekaiSettableLayoutType'] == "floor_appearance":
            bundle_name = f"tex_{bundle_name}_floor_appearance_1.webp"
        elif fixture['mysekaiFixtureType'] == "wall_appearance":
            bundle_name = f"tex_{bundle_name}_wall_appearance.webp"

        bundle_path = next((path for path in fixtures_paths if bundle_name in path), "")
        bundle_path = bundle_path.replace(MYSEKAI_DATA_PATH, "./") if bundle_path else ""
        bundle_hash = hashlib.md5(bundle_path.encode()).hexdigest()

        fixtures[str(fixture_id)] = {
            "seq": fixture['seq'],
            "id": fixture_id,
            "name": fixture['name'],
            "type": fixture['mysekaiFixtureType'],
            "type_sub": fixture['mysekaiSettableLayoutType'],
            "genre_main": genre_main.get(fixture.get('mysekaiFixtureMainGenreId')),
            "genre_sub": genre_sub.get(fixture.get('mysekaiFixtureSubGenreId', None)),
            "bundle_name": bundle_name,
            "bundle_path": bundle_path,
            "bundle_hash": bundle_hash,
        }

        fixtures_hashmap[bundle_hash] = fixtures[str(fixture_id)]

    return {"id": fixtures, "hash": fixtures_hashmap}

def map_fixtures_from_users(uids):
    fixture_map = {}

    for uid in uids:
        entries = get_mysekai_entry(uid)
        for layout in entries.get("userMysekaiSiteHousingLayouts", []):
            for fixture in layout.get('mysekaiFixtureSurfaceAppearances', []):
                fixture_id = str(fixture.get('mysekaiFixtureId'))
                if fixture_id and fixture_id != "900002":
                    fixture_map.setdefault(fixture_id, []).append(uid)

            for item_type in layout.get('mysekaiSiteHousingLayouts', []):
                for fixture in item_type.get('mysekaiFixtures', []):
                    fixture_id = str(fixture.get('mysekaiFixtureId'))
                    if fixture_id and fixture_id != "900002":
                        fixture_map.setdefault(fixture_id, []).append(uid)

    return fixture_map

def restore_keys_to_int(x):
    return {int(k): x[k] for k in x}

# Main script execution
def main():
    global skip_check
    global skip_all

    if len(sys.argv) > 1:
        skip_check = True
    if len(sys.argv) > 2:
        skip_all = True

    uid_list = [uid for uid in read_file(USER_FILE) if not uid.startswith("#")]

    # Process fixtures
    fixtures = process_fixtures()
    write_file(os.path.join(MYSEKAI_DATA_PATH, "_fixturesId.json"), json.dumps(fixtures['id']))
    write_file(os.path.join(MYSEKAI_DATA_PATH, "_fixturesHash.json"), json.dumps(fixtures['hash']))

    # Validate profiles
    valid_uids = validate_profiles(uid_list)

    # Map user fixtures
    if skip_all:
        user_fixtures = json.loads(open(USER_CACHE_FILE, "rb").read())
    else:
        user_fixtures = map_fixtures_from_users(valid_uids)
        if(len(user_fixtures) > 1):
            write_file(USER_CACHE_FILE, json.dumps(user_fixtures))
        else:
            print("Nope, I think the server has some issues.")
            user_fixtures = json.loads(open(USER_CACHE_FILE, "rb").read())

    # Process sketchable fixtures
    sketch_list = get_sketch_list(fixtures)

    sketchable_fixtures = {}
    for fixture_id, is_sketchable in sketch_list.items():
        try:
            fixture_id = str(fixture_id)
            sketchable_fixtures[fixture_id] = {
                "type": fixtures['id'][fixture_id]['type'],
                "item_name": fixtures['id'][fixture_id]['name'],
                "genre_name": fixtures['id'][fixture_id]['genre_main'],
                "genre_sub": fixtures['id'][fixture_id]['genre_sub'],
                "path": fixtures['id'][fixture_id]['bundle_hash'],
                "friend_codes": list(set(user_fixtures.get(fixture_id, []))),
                "is_sketchable": is_sketchable,
            }
        except Exception as e:
            print("ERROR - " + str(fixture_id))
            pass

    write_file(os.path.join(MYSEKAI_DATA_PATH, "ikea.json"), json.dumps(sketchable_fixtures))
    print("DONE!")

if __name__ == "__main__":
    main()
