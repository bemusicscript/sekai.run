#!/usr/bin/python -u
# pylint: disable=no-member, missing-function-docstring, consider-using-with, bare-except

"""
app.py

Main backend for Sekai
"""

from functools import wraps
import os
import time
import hashlib
import logging
import asyncio
import orjson
import redis
import httpx
import base64
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse, PlainTextResponse
from aiocache import Cache
from aiocache.serializers import PickleSerializer
from api.proseka import (
    SekaiUser,
    SekaiAPI,
)

# Configurations #

APP_VERSION = "v4.0-20250315"
CURRENT_PATH = os.path.dirname(os.path.realpath(__file__))
DATABASE_DIR = os.path.join(CURRENT_PATH, "database", "json")
PREDICT_DIR  = os.path.join(CURRENT_PATH, "..", "prediction")

# FastAPI Init #

app = FastAPI(
    docs_url=None,
    redoc_url=None,
    openapi_url=None
)

# Multiprocessing Cache #

"""
This caching is required to share objects across workers due to GIL
Dill seems to be better than pickle, but fastapi doesn't seem to support..
"""

app.cache = Cache(
    Cache.REDIS,
    endpoint="valkey.internal",
    port=6379,
    password="redacted",
    namespace="main",
    timeout=20,
    serializer=PickleSerializer(protocol=5),
)

app.cache_pool = redis.ConnectionPool(
        host="valkey.internal",
        port=6379,
        username="default",
        password="redacted",
        db=0,
        decode_responses=True
    )

app.timeout = {
    "session": 60 * 10,
    "scoreboard": 60 * 2,
    "predict": 60 * 10,
    "cards": 60 * 60,
    "current_event": 60 * 60,
    "current_bloom": 60 * 60,
    "current_cheerful": 60 * 30,
    "proxy": 60 * 60 * 12,
}

class RedisCache:
    """
    Redis aiocache
    """

    def __getattr__(self, name):
        """
        gets data from cache, otherwise return none values.
        """
        none_value = {}

        if name.endswith("_updated") or name.endswith("_eid"):
            none_value = -1
        if name.endswith("cards"):
            none_value = []

        return app.cache.get(name, none_value)

    async def set(self, name, value):
        """ set redis cache """
        return await app.cache.set(name, value)

    def __setattr__(self, name, value):
        return app.cache.set(name, value)

app.redis_cache = RedisCache()


# Update Database #


async def update_database():
    """
    Update asset database and write to output
    """
    await update_authentication()
    session = await app.redis_cache.session

    result = session.check_database()

    retry_count = 0
    while (result.get("httpStatus", None) in (426, 403) and
           retry_count < 5):
        retry_count += 1
        await update_authentication(True)
        session = await app.redis_cache.session
        result = session.check_database()

    if retry_count >= 5:
        result = {}

    for db_key, db_data in result.items():
        db_filename = os.path.join(DATABASE_DIR, db_key + ".json")
        with open(db_filename, "wb") as content:
            content.write(orjson.dumps(db_data))

    return True


# Helper functions #


async def update_authentication(force_reset=False):
    """
    Initialize token if not ready (for workers)
    Update token if session is expired
    Check if session / cards are updated properly
    if not, perform updates accordingly.
    """

    current_session = await app.redis_cache.session

    # if no session on redis, create new session and store into redis
    # regularly renew session
    if (not current_session or
        time.time() >= (await app.redis_cache.session_updated + app.timeout["session"]) or
        force_reset):
        if force_reset:
            logging.warning("update_authentication: reauthenticating due to force reset")
        else:
            logging.warning("update_authentication: reauthenticating due to session timeout")

        config_cache = redis.Redis(connection_pool=app.cache_pool)
        user = SekaiUser(
            config_cache.get("PROSEKA_UID"),
            config_cache.get("PROSEKA_TOKEN"),
            config_cache.get("PROSEKA_INSTALL_UUID")
        )
        current_session = SekaiAPI(user)
        current_session.login()
        await app.redis_cache.set("session", current_session)
        await app.redis_cache.set("session_updated", time.time())

    # renew cards which are regularly updated from `update_database()`
    if time.time() >= (await app.redis_cache.cards_updated + app.timeout["cards"]):
        cards = orjson.loads(open(os.path.join(DATABASE_DIR, "cards.json"), "rb").read())

        result = {}
        for card in cards:
            result[card["id"]] = card["assetbundleName"]

        await app.redis_cache.set("cards", result)
        await app.redis_cache.set("cards_updated", time.time())


def update_auth_required(func):
    """
    Wrapper function that calls update_authentication()
    """

    @wraps(func)
    async def wrapper(*args, **kwargs):
        await update_authentication()
        return await func(*args, **kwargs)

    return wrapper


# API Endpoints #


@app.get("/scoreboard/", response_class=ORJSONResponse)
@update_auth_required
async def current_scoreboard():
    """
    Scoreboard endpoint
    Returns scoreboard information
    """
    event = await current_event()
    event_id = event['id']

    scoreboard = await app.redis_cache.scoreboard
    session = await app.redis_cache.session

    if not scoreboard:
        scoreboard = {
            "data": None,
            "last_updated": -1,
        }
        await app.redis_cache.set("scoreboard", scoreboard)

    expiry_date = scoreboard["last_updated"] + app.timeout["scoreboard"]

    result = {"top100": {}, "highlight": {}}
    if time.time() >= expiry_date:
        result["top100"] = session.get_event_top_ranking(event_id)
        retry_count = 0
        while (result["top100"].get("httpStatus", {"httpStatus": 403}) in (426, 403) and
               retry_count < 5):
            retry_count += 1
            await update_authentication(True)
            session = await app.redis_cache.session
            result["top100"] = session.get_event_top_ranking(event_id)

        if retry_count >= 5:
            result["top100"] = {}

        result["highlight"] = session.get_event_highlight_ranking(event_id)
        retry_count = 0
        while (result["highlight"].get("httpStatus", {"httpStatus": 403}) in (426, 403) and
               retry_count < 5):
            retry_count += 1
            await update_authentication(True)
            session = await app.redis_cache.session
            result["highlight"] = session.get_event_highlight_ranking(event_id)

        if retry_count >= 5:
            result["highlight"] = {}

        scoreboard["data"] = result
        scoreboard["last_updated"] = int(time.time())
        await app.redis_cache.set("scoreboard", scoreboard)

    else:
        result = scoreboard["data"]

    await app.redis_cache.set("session", session)
    return result


@app.get("/scoreboard/force", response_class=ORJSONResponse)
@update_auth_required
async def current_scoreboard_nocache():
    """
    Scoreboard endpoint
    Returns scoreboard information
    """
    event = await current_event()
    event_id = event['id']
    session = await app.redis_cache.session

    t = time.time()
    result = {
        "top100": {},
        "highlight": {},
        "timing": {
            "top100": -1,
            "highlight": -1
        }
    }

    result["top100"] = session.get_event_top_ranking(event_id)
    retry_count = 0
    while (result["top100"].get("httpStatus", {"httpStatus": 403}) in (426, 403) and
           retry_count < 5):
        retry_count += 1
        await update_authentication(True)
        session = await app.redis_cache.session
        result["top100"] = session.get_event_top_ranking(event_id)

    if retry_count >= 5:
        result["top100"] = {}
    result['timing']['top100'] = time.time() - t

    t = time.time()
    result["highlight"] = session.get_event_highlight_ranking(event_id)
    retry_count = 0
    while (result["highlight"].get("httpStatus", {"httpStatus": 403}) in (426, 403) and
           retry_count < 5):
        retry_count += 1
        await update_authentication(True)
        session = await app.redis_cache.session
        result["highlight"] = session.get_event_highlight_ranking(event_id)

    if retry_count >= 5:
        result["highlight"] = {}
    result['timing']['highlight'] = time.time() - t

    await app.redis_cache.set("session", session)
    return result


@app.get("/profile/{friend_code}", response_class=ORJSONResponse)
@update_auth_required
async def get_profile(friend_code):
    """
    Check profile information
    """
    session = await app.redis_cache.session
    result = session.get_user_profile(str(friend_code))
    retry_count = 0
    while (result.get("httpStatus", {"httpStatus": 403}) in (426, 403) and
           retry_count < 5):
        retry_count += 1
        await update_authentication(True)
        session = await app.redis_cache.session
        result = session.get_user_profile(str(friend_code))

    if retry_count >= 5:
        result = {}

    await app.redis_cache.set("session", session)
    return result


@app.get("/mysekai/{friend_code}", response_class=ORJSONResponse)
@update_auth_required
async def get_mysekai_entry(friend_code):
    """
    Get mysekai entries
    """
    session = await app.redis_cache.session

    result = session.get_mysekai_room_info(friend_code)
    retry_count = 0
    while (result.get("httpStatus", {"httpStatus": 403}) in (426, 403) and
           retry_count < 5):
        retry_count += 1
        await update_authentication(True)
        session = await app.redis_cache.session
        result = session.get_mysekai_room_info(friend_code)

    if retry_count >= 5:
        result = {}

    await app.redis_cache.set("session", session)
    return result


@app.get("/cards/{card_id}", response_class=ORJSONResponse)
@update_auth_required
async def card_data(card_id: str):
    """
    Retrieve assetbundleName from cards
    """
    cards = await app.redis_cache.cards

    # for a single card
    if card_id.isdigit():
        return cards.get(int(card_id), None)

    # for multiple cards
    target_cards = card_id.split(",")
    if not target_cards:
        return {}

    result = {}
    for target_card in target_cards:
        result[int(target_card)] = cards.get(int(target_card), None)

    return result


@app.get("/current_event", response_class=ORJSONResponse)
async def current_event():
    """
    Fetch latest event information from asset data
    Using orjson for best performance
    """
    timeout = (await app.redis_cache.current_event_updated) + app.timeout["current_event"]
    if time.time() >= timeout:
        event_data = open(os.path.join(DATABASE_DIR, "events.json"), "rb").read()
        await app.redis_cache.set("current_event", event_data)
        await app.redis_cache.set("current_event_updated", time.time())

    # Grab currently running event
    event_data = orjson.loads(await app.redis_cache.current_event)
    possible_events = []
    for event in event_data:
        if (time.time() >= (event['eventOnlyComponentDisplayStartAt'] / 1000) and
            time.time() <= (event['eventOnlyComponentDisplayEndAt'] / 1000)):
            possible_events.append(event)

    current_event = possible_events[-1] if possible_events else event_data[-1]

    # Parse cheerful information
    current_event['cheerfulInfo'] = {}

    if current_event['eventType'] == "cheerful_carnival":
        cheerful_info = {}

        # Fetch information First
        timeout = (await app.redis_cache.current_cheerful_updated) + app.timeout["current_cheerful"]
        if time.time() >= timeout:
            cheerful_summary_data = open(os.path.join(DATABASE_DIR, "cheerfulCarnivalSummaries.json"), "rb").read()
            cheerful_teams_data = open(os.path.join(DATABASE_DIR, "cheerfulCarnivalTeams.json"), "rb").read()
            await app.redis_cache.set("current_cheerful_summary", cheerful_summary_data)
            await app.redis_cache.set("current_cheerful_teams", cheerful_teams_data)

        cheerful_summary_data = orjson.loads(await app.redis_cache.current_cheerful_summary)
        cheerful_teams_data = orjson.loads(await app.redis_cache.current_cheerful_teams)

        try:
            # Parse summary
            current_cheerful_summary = next(item for item in cheerful_summary_data if item["eventId"] == current_event['id'])
            current_cheerful_summary = {
                'theme': current_cheerful_summary['theme'],
                'midtermAnnounce1At': current_cheerful_summary['midtermAnnounce1At'],
                'midtermAnnounce2At': current_cheerful_summary['midtermAnnounce2At']
            }
            cheerful_info['summary'] = current_cheerful_summary
            # Parse teams
            current_cheerful_teams = list(filter(lambda item: item['eventId'] == current_event['id'], cheerful_teams_data))
            cheerful_info['teams'] = current_cheerful_teams

        except:
            cheerful_info['summary'] = {}
            cheerful_info['teams'] = []

        current_event['cheerfulInfo'] = cheerful_info

    return current_event

@app.get("/json/{filename}", response_class=ORJSONResponse)
async def get_asset_data(filename: str):
    """
    Fetch JSON data
    """
    fn = filename.replace("/", "").replace("..", "")
    fn = os.path.join(DATABASE_DIR, fn)

    if os.path.isfile(fn):
        return orjson.loads(open(fn, "rb").read())
    return {}


@app.get("/current_bloom", response_class=PlainTextResponse)
async def current_bloom():
    """
    Fetch bloom information
    Using plaintext for best performance
    """
    timeout = (await app.redis_cache.current_bloom_updated) + app.timeout["current_bloom"]
    if time.time() >= timeout:
        event_data = open(os.path.join(DATABASE_DIR, "worldBlooms.json"), "rb").read()
        await app.redis_cache.set("current_bloom", event_data)
        await app.redis_cache.set("current_bloom_updated", time.time())

    return await app.redis_cache.current_bloom



@app.get("/predict/", response_class=PlainTextResponse)
async def predict():
    """
    Prediction dataset
    Using plaintext for best performance
    """
    timeout = (await app.redis_cache.predict_updated) + app.timeout["predict"]
    if time.time() >= timeout:
        predict_data = open(os.path.join(PREDICT_DIR , "result.json"), "rb").read()
        await app.redis_cache.set("predict", predict_data)
        await app.redis_cache.set("predict_updated", time.time())

    return await app.redis_cache.predict


class ProxyRequestData(BaseModel):
    service_name: str = ""
    service_method: str = ""
    service_data: str = ""

@app.post("/proxy/", response_class=ORJSONResponse)
async def proxy(request: ProxyRequestData):
    cache_max_size = 10240
    service_list = {
        "jiiku": {
            "endpoint": "https://run-analysis-service.jiiku.dev/",
            "allowed_paths": {
                "analyze_team": {
                    "methods": ["GET"],
                },
                "batch_analyze_graph": {
                    "methods": ["POST"],
                }
            }
        }
    }

    # parse request's service name. usually happens to be ~/
    request_service = str(request.service_name).split("/")
    if len(request_service) < 2:
        return {
            'status': {
                'code': 2,
                'msg': 'endpoint not found',
            }
        }

    request_endpoint = request_service[0]
    request_path = "/".join(request_service[1:])
    # check endpoint
    if request_endpoint not in service_list:
        return {
            'status': {
                'code': 2,
                'msg': 'endpoint not foundd',
            }
        }
    request_host = service_list[request_endpoint]['endpoint']

    # check permissions
    service_info = service_list[request_endpoint]

    if (request_path not in service_info['allowed_paths'] or
        "\\" in request_path or
        "./" in request_path):
        return {
            'status': {
                'code': 2,
                'msg': 'permission error',
            }
        }

    allowed_methods = service_info['allowed_paths'][request_path]['methods']
    if request.service_method not in allowed_methods:
        return {
            'status': {
                'code': 2,
                'msg': 'method not supported',
            }
        }

    # block attacks
    if len(request.service_data) >= 1024 * 1024 * 5:
        return {
            'status': {
                'code': 2,
                'msg': 'data too long',
            }
        }

    # caching
    # let maximum allowed size to be 2048
    event = await current_event()
    event_id = event['id']
    proxy_data = await app.redis_cache.proxy_data
    proxy_eid = await app.redis_cache.proxy_eid
    proxy_key = f"{request_endpoint}|{request_path}|{request.service_method}|{request.service_data.strip()}"
    proxy_key = hashlib.sha256(proxy_key.encode()).hexdigest()

    # check if proxy timed out, or event is renewed, or cache is above limit
    timeout = (await app.redis_cache.proxy_updated) + app.timeout["proxy"]
    if time.time() >= timeout or event_id != proxy_eid or len(proxy_data) >= cache_max_size:
        await app.redis_cache.set("proxy_data", {})
        await app.redis_cache.set("proxy_eid", event_id)
        await app.redis_cache.set("proxy_updated", time.time())

    # fetch from proxy if exists
    if proxy_data.get(proxy_key):
        return proxy_data.get(proxy_key)

    # ... otherwise, just load from remote and store it onto the proxy
    async with httpx.AsyncClient() as client:
        try:
            match request.service_method:
                case "GET":
                    response = await client.get(
                        request_host + request_path + "?" + request.service_data,
                        timeout=4
                    )
                    response.raise_for_status()
                    output = response.json()

                case "POST":
                    # validate json data
                    data = orjson.loads(base64.b64decode(request.service_data))

                    response = await client.post(
                        request_host + request_path,
                        data=request.service_data,
                        timeout=4
                    )
                    response.raise_for_status()
                    output = response.json()

            if output:
                proxy_data[proxy_key] = output
                await app.redis_cache.set("proxy_data", proxy_data)
                return output

            else:
                return {
                    'status': {
                        'code': 2,
                        'msg': 'no output from remote content.',
                    }
                }

        except Exception as e:
            logging.error("proxy error: " + str(e))
            return {
                'status': {
                    'code': 2,
                    'msg': 'error from requested resources.',
                }
            }


@app.get("/reset/", response_class=PlainTextResponse)
async def reset():
    """
    Reset cache timer
    """
    await app.redis_cache.set("predict_updated", -1)
    await app.redis_cache.set("current_bloom_updated", -1)
    await app.redis_cache.set("current_event_updated", -1)
    await app.redis_cache.set("cards_updated", -1)
    await app.redis_cache.set("proxy_updated", -1)

    return "ok"



@app.get("/")
async def main():
    """
    Shows API version
    """
    return {"version": APP_VERSION}


if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(update_database())
