<?php

if (!defined("SCOREBOARD")) die;

header("Content-Type: application/json");
$uri = parse_url($_SERVER['REQUEST_URI']);

$api_version = "unknown";
switch($build_type){
    case "prod":
        $api_version = CURRENT_VERSION_PRD;
        break;
    case "alpha":
        $api_version = CURRENT_VERSION_ALP;
        break;
    case "beta":
        $api_version = CURRENT_VERSION_DEV;
        break;
}

$result = [
    "type" => "fail",
    "message" => null,
    "data" => null,
    "extra" => null,
    "version" => $api_version,
];
$cache_time = 120;

//////////////////////////// MySQL init

if (!init_mysqli()) {
    $result["message"] = "database is dead";
    return_json($result);
}
register_shutdown_function('shutdown');

//////////////////////////// Main API

$type = $_GET['type'] ?? '';

switch($type) {
    case "current_prediction":
        if (!check_permission("scoreboard")) {
            $result['type'] = "permission";
            break;
        }
        $cache_time = 600;
        $result['type'] = "success";
        $result['data'] = @file_get_contents("http://" . API_DOMAIN . "/predict/");
        $api_encrypt['mode'] = "light";
        break;

    case "current_event":
        $cache_time = 3600;
        if (!check_permission("scoreboard")) {
            $result['type'] = "permission";
            break;
        }
        $result['type'] = "success";
        $result['data'] = fetch_current_event();
        break;

    case "current_bloom":
        $cache_time = 3600;
        if (!check_permission("scoreboard")) {
            $result['type'] = "permission";
            break;
        }
        $result['type'] = "success";
        $result['data'] = fetch_current_bloom();
        break;

    case "external_service":
        $cache_time = 300;
        $result['type'] = "success";

        $data = @file_get_contents("php://input");
        $data = @json_decode(xor_string($data, "\x0f"), true);
        if(!$data) break;
        $_POST = $data;
        $result['posts'] = $_POST;
        if($_POST['service_method'] == "POST") $_POST['service_data'] = base64_encode($_POST['service_data']);
        $post_data = json_encode(
            array(
                "service_name"   => (string) $_POST['service_name'],
                "service_method" => (string) $_POST['service_method'],
                "service_data"   => (string) $_POST['service_data'],
            )
        );
        $context = stream_context_create(
            array('http' =>
                array(
                    "timeout" => 3,
                    "method"  => "POST",
                    "header"  => "Content-Type: application/json",
                    "content" => $post_data
                )
            )
        );
        $result['data'] = @file_get_contents("http://" . API_DOMAIN . "/proxy/", false, $context);
        break;

    case "profile":
        if (!check_permission("profile")) {
            $result['type'] = "permission";
            break;
        }
        handle_profile($mysqli, $result);
        break;

    case "profile_raw":
        if (!check_permission("profile_raw")) {
            $result['type'] = "permission";
            break;
        }
        handle_profile_raw($mysqli, $result);
        break;

    case "scoreboard":
        if (!check_permission("scoreboard")) {
            $result['type'] = "permission";
            break;
        }
        $result['active'] = @explode("\n", file_get_contents("../data/active_user.txt"))[0];
        handle_scoreboard($mysqli, $result);
        break;

    default:
        $result["message"] = "command not provided";
        break;
}

header("Cache-Control: max-age=" . $cache_time);
return_json($result);


//////////////////////////// Functions

function truncate_string($str)
{
    $out = mb_strlen($str) > 10 ? mb_substr($str, 0, 9) . "…" : $str;
    return $out;
}

function check_permission($permission_name)
{
    global $api_permissions;
    global $result;

    return (bool) in_array($permission_name, $api_permissions, true);
}

function fetch_profile_raw($mysqli, $profile_id)
{
    // fetch profile from cache
    $ret = [];

    $stmt = $mysqli->prepare("SELECT * FROM profile WHERE profile_id=? LIMIT 1");
    $stmt->bind_param('i', $profile_id);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();

    $is_created = $res !== null;
    $is_updated = $is_created && (time() <= ((int)$res['profile_updated']) + 600);

    $profile_data = @json_decode(file_get_contents("http://" . API_DOMAIN . "/profile/{$profile_id}"), true);
    unset($profile_data['userDeck']['userId']);

    $new_profile_id = (int) $profile_data['userProfile']['userId'];
    $new_profile_nickname = $profile_data['user']['name'];
    $new_profile_total_score = $profile_data['totalPower'];
    $new_profile_updated = time();

    $_cards = $profile_data['userCards'];
    $_decks = $profile_data['userDeck'];
    $new_profile_decks = [];

    // batch queries for members, request all at once.
    $_decks_cards = [];
    for ($i=1; $i<=5; $i++) {
        $_decks_cards[$i] = (int) $_decks["member{$i}"];
    }

    $_decks_cards = implode(",", $_decks_cards);
    $card_assets = @json_decode(file_get_contents("http://" . API_DOMAIN . "/cards/{$_decks_cards}"), true);
    for ($i=1; $i<=5; $i++) {
        $current_deck_id = (int) $_decks["member{$i}"];
        $current_card = null;

        foreach ($_cards as $_card) {
            if ($current_deck_id == $_card['cardId']){
                $_card['cardAsset'] = $card_assets[$_card['cardId']];
                $new_profile_decks []= $_card;
                break;
            }
        }
    }

    if (!$is_updated || !$is_created) {
        if (!$is_created) {
            $stmt = $mysqli->prepare("INSERT INTO profile VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param('isssi', $new_profile_id, $new_profile_nickname, json_encode($new_profile_decks), json_encode($new_profile_total_score), $new_profile_updated);
        } else {
            $stmt = $mysqli->prepare("UPDATE profile SET profile_nickname=?, profile_decks=?, profile_total_score=?, profile_updated=? WHERE profile_id=?");
            $stmt->bind_param('ssssi', $new_profile_nickname, json_encode($new_profile_decks), json_encode($new_profile_total_score), $new_profile_updated, $new_profile_id);
        }
        $stmt->execute();
    }
    $ret['data'] = $profile_data;
    return $ret;
}

function handle_profile_raw($mysqli, &$result)
{
    $current_event = fetch_current_event();
    $event_id = (int) $current_event['id'];
    $profile_id = @profile_decrypt($_GET['profile_id']);

    // sanitize input
    if (!$profile_id || !is_numeric($profile_id)) {
        $result["message"] = "profile not found";
        return;
    }
    $profile_id = (int) $profile_id;

    // fetch profiles
    $tmp = fetch_profile_raw($mysqli, $profile_id);
    $result['data'] = $tmp['data'];
    $result['extra'] = $tmp['extra'];
    $result['type'] = "success";
}

function fetch_profile($mysqli, $profile_id)
{
    global $dangerous_players;
    // fetch profile from cache
    $ret = [];

    $stmt = $mysqli->prepare("SELECT * FROM profile WHERE profile_id=? LIMIT 1");
    $stmt->bind_param('i', $profile_id);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();

    $is_created = $res !== null;
    $is_updated = $is_created && (time() <= ((int)$res['profile_updated']) + 600);

    if (!$is_updated || !$is_created) {
        $profile_data = @json_decode(file_get_contents("http://" . API_DOMAIN . "/profile/{$profile_id}"), true);
        unset($profile_data['userDeck']['userId']);

        $new_profile_id = (int) $profile_data['userProfile']['userId'];
        $new_profile_nickname = $profile_data['user']['name'];
        $new_profile_total_score = $profile_data['totalPower'];
        $new_profile_updated = time();

        $_cards = $profile_data['userCards'];
        $_decks = $profile_data['userDeck'];
        $new_profile_decks = [];

        // batch queries for members, request all at once.
        $_decks_cards = [];
        for ($i=1; $i<=5; $i++) {
            $_decks_cards[$i] = (int) $_decks["member{$i}"];
        }
        $_decks_cards = implode(",", $_decks_cards);
        $card_assets = @json_decode(file_get_contents("http://" . API_DOMAIN . "/cards/{$_decks_cards}"), true);

        for ($i=1; $i<=5; $i++) {
            $current_deck_id = (int) $_decks["member{$i}"];
            $current_card = null;

            foreach ($_cards as $_card) {
                if ($current_deck_id == $_card['cardId']){
                    $_card['cardAsset'] = $card_assets[$_card['cardId']];
                    $new_profile_decks []= $_card;
                    break;
                }
            }
        }

        if (!$is_created) {
            $stmt = $mysqli->prepare("INSERT INTO profile VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param('isssi', $new_profile_id, $new_profile_nickname, json_encode($new_profile_decks), json_encode($new_profile_total_score), $new_profile_updated);
        } else {
            $stmt = $mysqli->prepare("UPDATE profile SET profile_nickname=?, profile_decks=?, profile_total_score=?, profile_updated=? WHERE profile_id=?");
            $stmt->bind_param('ssssi', $new_profile_nickname, json_encode($new_profile_decks), json_encode($new_profile_total_score), $new_profile_updated, $new_profile_id);
        }
        $stmt->execute();

        $ret['data'] = [
            "profile_nickname" => htmlspecialchars(truncate_string($new_profile_nickname)),
            "profile_decks" => $new_profile_decks,
            "profile_score" => $new_profile_total_score,
            "profile_updated" => (int)$new_profile_updated,
            "profile_graph" => ["all" => ["x" => [], "y" => []], "wl" => []],
            "border_graph" => ["all" => ["x" => [], "y" => []], "wl" => []],
            "compare_graph" => ["all" => ["x" => [], "y" => []], "wl" => []],
        ];
        $ret['extra'] = "updated";

    } else {
        $ret['data'] = [
            "profile_nickname" => htmlspecialchars(truncate_string($res['profile_nickname'])),
            "profile_decks" => json_decode($res['profile_decks']),
            "profile_score" => json_decode($res['profile_total_score']),
            "profile_updated" => (int)$res['profile_updated'],
            "profile_graph" => ["all" => ["x" => [], "y" => []], "wl" => []],
            "border_graph" => ["all" => ["x" => [], "y" => []], "wl" => []],
            "compare_graph" => ["all" => ["x" => [], "y" => []], "wl" => []],
        ];
        $ret['extra'] = "not updated";
    }

    if(array_key_exists($profile_id, $dangerous_players)){
        $ret['data']['profile_dangerous'] = $dangerous_players[$profile_id];
    }

    return $ret;
}

function handle_profile($mysqli, &$result)
{
    $current_event = fetch_current_event();
    $event_id = (int) $current_event['id'];
    $profile_id = @profile_decrypt($_GET['profile_id']);
    $compare_profile_id = @profile_decrypt($_GET['compare_profile_id']);

    // sanitize input
    if (!$profile_id || !is_numeric($profile_id)) {
        $result["message"] = "profile not found";
        // $result["debug"] = $profile_id;
        return;
    }
    if (!$compare_profile_id || !is_numeric($compare_profile_id)) {
        $compare_profile_id = "";
    }
    $profile_id = (int) $profile_id;
    $compare_profile_id = (int) $compare_profile_id;

    // fetch profiles
    $tmp = fetch_profile($mysqli, $profile_id);
    $result['data'] = $tmp['data'];
    $result['extra'] = $tmp['extra'];
    $result['type'] = "success";

    if ($compare_profile_id) {
        $tmp = fetch_profile($mysqli, $compare_profile_id);
        unset($tmp['data']['border_graph']);
        unset($tmp['data']['profile_graph']);
        unset($tmp['data']['compare_graph']);
        $result['data']['compare_info'] = $tmp['data'];
        $result['extra_compare'] = $tmp['extra'];
        populate_graphs($mysqli, $result, $event_id, $profile_id, $compare_profile_id);
        get_profile_history($mysqli, $result, $profile_id, $compare_profile_id);
    } else {
        populate_graphs($mysqli, $result, $event_id, $profile_id, null);
        get_profile_history($mysqli, $result, $profile_id, null);
    }

}

function get_profile_history($mysqli, &$result, $profile_id, $compare_profile_id)
{
    $profile_dataset = [
        "profile_history" => [
            "id" => $profile_id
        ],
        "profile_history_compare" => [
            "id" => $compare_profile_id
        ],
    ];
    $event_all = @json_decode(file_get_contents("http://" . API_DOMAIN . "/json/events.json"), true);

    foreach($profile_dataset as $profile_type => $profile_data){
        $stmt = $mysqli->prepare("SELECT scoreboard_event_id, scoreboard_rank, scoreboard_profile_id, scoreboard_nickname, scoreboard_score, scoreboard_type FROM scoreboard_history WHERE scoreboard_profile_id=? ORDER BY scoreboard_event_id DESC");
        $stmt->bind_param('i', $profile_data['id']);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $result['data'][$profile_type] = [];

        $event_info = [];
        foreach($event_all as $event_single){
            $event_info[$event_single['id']] = [
                "name" => $event_single['name']
            ];
        }


        foreach ($res as $value) {
            // dont show chapters
            if($value['scoreboard_type'] != "0") continue;
            $result['data'][$profile_type][] = [
                "event_id" => $value['scoreboard_event_id'],
                "event_name" => @$event_info[$value['scoreboard_event_id']]['name'],
                "nickname" => htmlspecialchars(truncate_string($value['scoreboard_nickname'])),
                "type" => $value['scoreboard_type'],
                "rank" => $value['scoreboard_rank'],
                "score" => $value['scoreboard_score'],
            ];
        }
    }
}

function populate_graphs($mysqli, &$result, $event_id, $profile_id, $compare_profile_id)
{
    $stmt = $mysqli->prepare("SELECT scoreboard_updated, scoreboard_type, scoreboard_score FROM scoreboard_current WHERE scoreboard_event_id=? AND scoreboard_profile_id=? ORDER BY scoreboard_id ASC");
    $stmt->bind_param('ii', $event_id, $profile_id);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($res as $value) {
        if ($value['scoreboard_type'] != 0) {
            if (!isset($result['data']['profile_graph']['wl'][$value['scoreboard_type']])) {
                $result['data']['profile_graph']['wl'][$value['scoreboard_type']] = ["x" => [], "y" => []];
            }

            $result['data']['profile_graph']['wl'][$value['scoreboard_type']]['x'][] = (int) $value['scoreboard_updated'] * 1000;
            $result['data']['profile_graph']['wl'][$value['scoreboard_type']]['y'][] = (int) $value['scoreboard_score'];
        } else {
            $result['data']['profile_graph']['all']['x'][] = (int) $value['scoreboard_updated'] * 1000;
            $result['data']['profile_graph']['all']['y'][] = (int) $value['scoreboard_score'];
        }
    }

    $rank_id = (int) $_GET['rank_id'];
    if ($rank_id < 1) return;

    $stmt = $mysqli->prepare("SELECT scoreboard_updated, scoreboard_type, scoreboard_score FROM scoreboard_current WHERE scoreboard_event_id=? AND scoreboard_rank=? ORDER BY scoreboard_id ASC");
    $stmt->bind_param('ii', $event_id, $rank_id);
    $stmt->execute();
    $res_border = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($res_border as $value) {
        if ($value['scoreboard_type'] != 0) {
            if (!isset($result['data']['border_graph']['wl'][$value['scoreboard_type']])) {
                $result['data']['border_graph']['wl'][$value['scoreboard_type']] = ["x" => [], "y" => []];
            }

            $result['data']['border_graph']['wl'][$value['scoreboard_type']]['x'][] = (int) $value['scoreboard_updated'] * 1000;
            $result['data']['border_graph']['wl'][$value['scoreboard_type']]['y'][] = (int) $value['scoreboard_score'];
        } else {
            $result['data']['border_graph']['all']['x'][] = (int) $value['scoreboard_updated'] * 1000;
            $result['data']['border_graph']['all']['y'][] = (int) $value['scoreboard_score'];
        }
    }

    if (!$compare_profile_id) return;

    $stmt = $mysqli->prepare("SELECT scoreboard_updated, scoreboard_type, scoreboard_score FROM scoreboard_current WHERE scoreboard_event_id=? AND scoreboard_profile_id=? ORDER BY scoreboard_id ASC");
    $stmt->bind_param('ii', $event_id, $compare_profile_id);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($res as $value) {
        if ($value['scoreboard_type'] != 0) {
            if (!isset($result['data']['compare_graph']['wl'][$value['scoreboard_type']])) {
                $result['data']['compare_graph']['wl'][$value['scoreboard_type']] = ["x" => [], "y" => []];
            }

            $result['data']['compare_graph']['wl'][$value['scoreboard_type']]['x'][] = (int) $value['scoreboard_updated'] * 1000;
            $result['data']['compare_graph']['wl'][$value['scoreboard_type']]['y'][] = (int) $value['scoreboard_score'];
        } else {
            $result['data']['compare_graph']['all']['x'][] = (int) $value['scoreboard_updated'] * 1000;
            $result['data']['compare_graph']['all']['y'][] = (int) $value['scoreboard_score'];
        }
    }
}

function handle_scoreboard($mysqli, &$result)
{
    global $dangerous_players;

    $current_event = fetch_current_event();
    $event_id = (int) $current_event['id'];
    $current_bloom = fetch_current_bloom()[$event_id];

    $scoreboard_status = [
        "round" => 0,
        "updated" => -1,
    ];

    // Get chapter lists
    $chapter_list = [0];
    if($current_bloom){
        foreach($current_bloom as $chapter_name => $chapter_duration){
            $chapter_list[] = $chapter_name;
        }
    }

    // Calculate rounds (optimized)
    // this should be 100x faster than GROUP BY..
    $round_query = "";
    foreach($chapter_list as $chapter_id){
        $round_query_template = "COALESCE((SELECT scoreboard_round FROM scoreboard_current WHERE scoreboard_type=%d ORDER BY scoreboard_round DESC LIMIT 1), 0) AS round_%d, ";
        $round_query .= sprintf($round_query_template, $chapter_id, $chapter_id);
    }
    $round_query = substr($round_query, 0, -2);
    $stmt = $mysqli->prepare("SELECT $round_query LIMIT 1");
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();

    if (!$res || !$res['round_0'] || $res['round_0'] == "0") {
        $result["message"] = "not updated yet";
        $result["extra"] = $scoreboard_status;
        return;
    }

    $scoreboard_status = [
        "round" => $res,
    ];

    // Fetch all first...
    $result_all = [];
    $result_wl = [];

    $traversed_chapters = [];
    foreach($chapter_list as $chapter_id){

        // remove duplicate chapters
        if(in_array($chapter_id, $traversed_chapters)) continue;
        $traversed_chapters[] = $chapter_id;

        // if round is not yet available, the chapter didn't start. we skip those.
        $round = (int) $scoreboard_status["round"]["round_" . $chapter_id];
        if($round == 0) continue;
        $last_hour_round = $round - 60;
        $last_10min_round = $round - 2;

        // Current data
        $query = <<< EOF
            SELECT
                score_current.scoreboard_type,
                score_current.scoreboard_profile_id,
                score_current.scoreboard_nickname,
                score_current.scoreboard_score,
                score_last_hour.scoreboard_score AS scoreboard_score_last_hour,
                score_current.scoreboard_info_cheerful,
                score_current.scoreboard_info_card
            FROM scoreboard_current AS score_current
            LEFT OUTER JOIN
                (SELECT scoreboard_profile_id, scoreboard_type, scoreboard_round, scoreboard_score
                 FROM scoreboard_current WHERE scoreboard_event_id=? AND scoreboard_round=?) AS score_last_hour
            ON score_current.scoreboard_profile_id = score_last_hour.scoreboard_profile_id
            AND score_current.scoreboard_type = score_last_hour.scoreboard_type
            WHERE score_current.scoreboard_event_id=? AND score_current.scoreboard_round=? AND score_current.scoreboard_type=?
            ORDER BY score_current.scoreboard_score DESC;
        EOF;
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param('iiiii', $event_id, $last_hour_round, $event_id, $round, $chapter_id);
        $stmt->execute();
        $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Last hour data
        $query = <<<EOF
            SELECT scoreboard_type, scoreboard_score, scoreboard_rank, scoreboard_round, scoreboard_rank
             FROM scoreboard_current WHERE scoreboard_event_id=? AND scoreboard_round=? AND scoreboard_type=? ORDER BY scoreboard_type ASC, scoreboard_score DESC
        EOF;
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param('iii', $event_id, $last_hour_round, $chapter_id);
        $stmt->execute();
        $data_last_hour = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Parse Values
        foreach ($data as $value) {
            $character_id = $value['scoreboard_type'];
            $value['scoreboard_profile_id_hash'] = sha1("RANDOM_NUMBER_AZUSAWA@@@" . $value['scoreboard_profile_id'] . "@@KOHANE_RANDOM_20250302!!");

            if(array_key_exists($value['scoreboard_profile_id'], $dangerous_players)){
                $value['scoreboard_dangerous'] = $dangerous_players[$value['scoreboard_profile_id']];
            }
            $value['scoreboard_profile_id'] = profile_encrypt($value['scoreboard_profile_id']);
            $value['scoreboard_nickname'] = htmlspecialchars(truncate_string($value['scoreboard_nickname']));
            $value['scoreboard_score'] = (int) $value['scoreboard_score'];
            if ((int)$value['scoreboard_score_last_hour'] > 0) $value['scoreboard_score_last_hour'] = (int) $value['scoreboard_score_last_hour'];
            unset($value['scoreboard_type']);

            if ($character_id == "0") {
                $result_all[] = $value;
            } else {
                if (!isset($result_wl[$character_id])) {
                    $result_wl[$character_id] = [];
                }
                $result_wl[$character_id][] = $value;
            }
        }

        // Parse Last Hour Information
        $idx = 0;
        $idx_wl = [];
        foreach ($data_last_hour as $value) {
            $character_id = $value['scoreboard_type'];
            if ($character_id == "0") {
                if ((int) $value['scoreboard_score'] > 0) $value['scoreboard_score'] = (int) $value['scoreboard_score'];
                $result_all[$idx]['scoreboard_score_last_hour_banner'] = $value['scoreboard_score'];
                $idx += 1;
            } else {
                if (!isset($idx_wl[$character_id])) {
                    $idx_wl[$character_id] = 0;
                }

                if ((int) $value['scoreboard_score'] > 0) $value['scoreboard_score'] = (int) $value['scoreboard_score'];
                $result_wl[$character_id][$idx_wl[$character_id]]['scoreboard_score_last_hour_banner'] = $value['scoreboard_score'];

                $idx_wl[$character_id] += 1;
            }
        }
    }

    $result["type"] = "success";
    $result["data"] = [
        "all" => $result_all,
        "wl" => $result_wl
    ];
    $result["extra"] = $scoreboard_status;
}

function shutdown()
{
    global $mysqli;
    // kill mysqli
    if ($mysqli) {
        $mysqli->close();
    }
}

?>
