import os
import time
import itertools
import datetime
import requests
import mariadb


SQL_SERVER = "mariadb.internal"
API_SERVER = "http://api.internal:5000"
CURRENT_PATH = os.path.dirname(os.path.realpath(__file__))
TMP_PATH = os.path.join(CURRENT_PATH, "tmp_current")
CARD_CACHE = {}

mysql = mariadb.connect(
    host=SQL_SERVER,
    user="sekai",
    passwd="sekai",
    database="sekai",
)

def fetch_card_asset(card_id):
    try:
        if CARD_CACHE.get(card_id):
            return CARD_CACHE[card_id]

        r = requests.get(f"{API_SERVER}/cards/{card_id}").json()
        resp = r
        if resp.startswith("res"):
            CARD_CACHE[card_id] = resp
            return resp
        else:
            return None
    except:
        return None

def get_current_event():
    r = requests.get(f"{API_SERVER}/current_event").json()

    event_start_int = int(r["startAt"] / 1000)
    event_start_str = str(datetime.datetime.fromtimestamp(event_start_int))
    event_end_int = int(r["aggregateAt"] / 1000)
    event_end_str = str(datetime.datetime.fromtimestamp(event_end_int))

    return {
        "event_id": r["id"],
        "event_name": r["name"],
        "event_start": event_start_int,
        "event_end": event_end_int,
        "event_start_str": event_start_str,
        "event_end_str": event_end_str,
    }

def get_current_bloom_characters():
    try:
        r = requests.get(f"{API_SERVER}/current_bloom").json()
        result = {}

        for chapter in r:
            event_id = chapter['eventId']
            chapter_start_int = (chapter['chapterStartAt'] / 1000)
            chapter_end_int = (chapter['chapterEndAt'] / 1000)
            # worldBloomChapterType	"finale", chapterNo: 1
            chapter_character_id = chapter.get('gameCharacterId', 10000)

            # +-1hr before/after
            if time.time() >= chapter_start_int - 720 and time.time() <= chapter_end_int + 720:
                result[chapter_character_id] = event_id

        return result
    except:
        return {}

def get_scoreboard(event_info):
    # Skip if the scoreboard does not need to be crawled
    if time.time() < event_info["event_start"] or time.time() > (
        event_info["event_end"] + 600
    ):
        return None

    try:
        r = requests.get(f"{API_SERVER}/scoreboard/force").json() #{event_info['event_id']}").json()
    except:
        r = requests.get(f"{API_SERVER}/scoreboard/force").json() #{event_info['event_id']}").json()
    # Skip if the scoreboard is complete
    if r["top100"]["isEventAggregate"]:
        return None

    return r


def get_round(event_id):
    try:
        return int(open(f"{TMP_PATH}/{int(event_id)}.txt", "r").read())
    except:
        return 0


def set_round(event_id, value):
    f = open(f"{TMP_PATH}/{int(event_id)}.txt", "w")
    f.write(str(value))
    f.close()


def update_data():
    event_info = get_current_event()

    # print([time.time(), event_info["event_start"]])
    if int(time.time()) < event_info["event_start"]:
        print("Event not yet!")
        return

    if int(time.time()) >= event_info["event_end"] + 600:
        print("Event ended!")

        # Record history
        cur = mysql.cursor()
        sql = "SELECT * FROM scoreboard_history WHERE scoreboard_event_id=%d"
        cur.execute(sql, (event_info['event_id'],))
        result = cur.fetchall()
        if len(result) > 0:
            print("Event already recorded..")
            return

        sql = "SELECT scoreboard_type from scoreboard_current where scoreboard_event_id=%d GROUP BY scoreboard_type"
        cur.execute(sql, (event_info['event_id'],))
        chapter_list = [i[0] for i in cur.fetchall()]

        current_result = []

        for chapter in chapter_list:
            sql = "SELECT scoreboard_round FROM scoreboard_current WHERE scoreboard_event_id=%d AND scoreboard_type=%d ORDER BY scoreboard_id DESC LIMIT 1"
            cur.execute(sql, (event_info['event_id'], chapter))
            latest_round = cur.fetchone()[0]

            sql = "SELECT NULL, scoreboard_event_id, scoreboard_rank, scoreboard_profile_id, scoreboard_nickname, scoreboard_score, scoreboard_type from scoreboard_current where scoreboard_event_id=%d AND scoreboard_type=%d AND scoreboard_round=%d"
            cur.execute(sql, (event_info['event_id'], chapter, latest_round))
            current_result.extend(cur.fetchall())

        # print(current_result)
        sql = "INSERT INTO scoreboard_history VALUES "
        sql += "(%s, %s, %s, %s, %s, %s, %s), " * len(current_result)
        sql = sql[:-2] + ";"
        val = list(itertools.chain(*current_result))
        cur.execute(sql, val)
        mysql.commit()
        cur.close()
        return

    # Total ranking
    cur = mysql.cursor()
    fetch_time = int(time.time())

    # Increment round
    current_round = get_round(event_info["event_id"]) + 1

    # Delete and flush the entire table first.
    if current_round == 1:
        sql = "DELETE FROM scoreboard_current;"
        cur.execute(sql)
        mysql.commit()

    set_round(event_info["event_id"], current_round)

    bloom_data = get_current_bloom_characters()
    event_data = get_scoreboard(event_info)

    # border top 100
    query_values = []

    for ranker in event_data["highlight"].get("borderRankings", None):
        if ranker["rank"] == 100:
            continue

        card_info = {
            "card_id": fetch_card_asset(ranker.get("userCard", {}).get("cardId", 0)),
            "level": ranker.get("userCard", {}).get("level", "60"),
            "mr": ranker.get("userCard", {}).get("masterRank", "0"),
            "type": ranker.get("userCard", {}).get("defaultImage", "special_training")
        }
        card_text = f"{card_info['card_id']}/{card_info['level']}/{card_info['mr']}/{card_info['type']}"
        val = (
            None,
            event_info["event_id"],
            0,
            current_round,
            ranker.get("userProfile", {}).get("userId", 0),
            ranker.get("name", ""),
            ranker.get("score", "-1"),
            fetch_time,
            ranker.get("rank", ""),
            None, # cheerfulInfo
            card_text,
            ranker.get("userProfile", {}).get("twitterId", "")
        )
        query_values.append(val)

    # border WL
    for event in event_data["highlight"].get("userWorldBloomChapterRankingBorders", None):

        for ranker in event.get("borderRankings", None):
            if ranker["rank"] == 100:
                continue
            if not bloom_data.get(event["gameCharacterId"], None):
                continue

            card_info = {
                "card_id": fetch_card_asset(ranker.get("userCard", {}).get("cardId", 0)),
                "level": ranker.get("userCard", {}).get("level", "60"),
                "mr": ranker.get("userCard", {}).get("masterRank", "0"),
                "type": ranker.get("userCard", {}).get("defaultImage", "special_training")
            }
            card_text = f"{card_info['card_id']}/{card_info['level']}/{card_info['mr']}/{card_info['type']}"
            val = (
                None,
                event_info["event_id"],
                event["gameCharacterId"],
                current_round,
                ranker.get("userProfile", {}).get("userId", 0),
                ranker.get("name", ""),
                ranker.get("score", "-1"),
                fetch_time,
                ranker.get("rank", ""),
                None,
                card_text,
                ranker["userProfile"].get("twitterId", "")
            )
            query_values.append(val)

    # top 100
    for ranker in event_data["top100"].get("rankings", None):
        card_info = {
            "card_id": fetch_card_asset(ranker.get("userCard", {}).get("cardId", 0)),
            "level": ranker.get("userCard", {}).get("level", "60"),
            "mr": ranker.get("userCard", {}).get("masterRank", "0"),
            "type": ranker.get("userCard", {}).get("defaultImage", "special_training")
        }
        card_text = f"{card_info['card_id']}/{card_info['level']}/{card_info['mr']}/{card_info['type']}"
        val = (
            None,
            event_info["event_id"],
            0,
            current_round,
            ranker.get("userProfile", {}).get("userId", 0),
            ranker.get("name", ""),
            ranker.get("score", "-1"),
            fetch_time,
            ranker.get("rank", ""),
            None,
            card_text,
            ranker["userProfile"].get("twitterId", "")
        )
        query_values.append(val)

    # WL
    for event in event_data["top100"].get("userWorldBloomChapterRankings", None):
        for ranker in event.get("rankings", None):
            if not bloom_data.get(event["gameCharacterId"], None):
                continue

            card_info = {
                "card_id": fetch_card_asset(ranker.get("userCard", {}).get("cardId", 0)),
                "level": ranker.get("userCard", {}).get("level", "60"),
                "mr": ranker.get("userCard", {}).get("masterRank", "0"),
                "type": ranker.get("userCard", {}).get("defaultImage", "special_training")
            }
            card_text = f"{card_info['card_id']}/{card_info['level']}/{card_info['mr']}/{card_info['type']}"
            val = (
                None,
                event_info["event_id"],
                event["gameCharacterId"],
                current_round,
                ranker.get("userProfile", {}).get("userId", 0),
                ranker.get("name", ""),
                ranker.get("score", "-1"),
                fetch_time,
                ranker.get("rank", ""),
                None,
                card_text,
                ranker["userProfile"].get("twitterId", "")
            )
            query_values.append(val)

    sql = "INSERT INTO scoreboard_current VALUES "
    sql += "(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()), " * len(query_values)
    sql = sql[:-2] + ";"
    val = list(itertools.chain(*query_values))

    cur.execute(sql, val)
    mysql.commit()
    cur.close()
    return True


if __name__ == "__main__":
    update_data()
    print("Done")
    mysql.close()
