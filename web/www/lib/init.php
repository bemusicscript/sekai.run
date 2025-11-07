<?php

if(!defined("SCOREBOARD")) die;

ini_set("display_errors", "off");
error_reporting(0);

//////////////////////////// GLOBAL VARIABLES

// start session for a week
session_name("sekai");
ini_set('session.gc_maxlifetime', 3600 * 24 * 7);
session_set_cookie_params(3600 * 24 * 7);
session_start();
date_default_timezone_set('Asia/Tokyo');

define("CURRENT_VERSION_PRD", "v6.5.251026_nene");
define("CURRENT_VERSION_ALP", "v6.6.alpha_nene");
define("CURRENT_VERSION_DEV", "v6.6.dev_nene");
define("SECRET_KEY", md5("FIXME"));
define("SECRET_KEY_TURNSTILE", "FIXME");

// prod
$javascript_cache_dir = "/var/www/data/javascript/cache/";
$javascript_filename = $javascript_cache_dir . scandir($javascript_cache_dir)[3];
$javascript_revision = filemtime($javascript_filename);

// alpha
$javascript_alpha_cache_dir = "/var/www/data/javascript_alpha/cache/";
$javascript_alpha_filename = $javascript_alpha_cache_dir . scandir($javascript_alpha_cache_dir)[3];
$javascript_alpha_revision = filemtime($javascript_alpha_filename);

// generate hash for this month
$script_hashes = [
    "main" => hash("sha256", "FIXME1"),
    "script_prod"  => hash("sha256", "FIXME2"),
    "script_alpha" => hash("sha256", "FIXME3"),
    "date" => date("Y-m-d H:i:s"),
];

$api_encrypt = [
    "mode" => "full",
    "profile" => "full"
];

$api_permissions = [
    "scoreboard",
    "profile"
];

$invite_codes = [
    "FIXME4",
];

$multitab_allowlist = [
    "sekai"
];

$redis = null;
$mysqli = null;

//////////////////////////// SERVICE INIT

require("../shared/lib/init.php");
require("const.php");

//////////////////////////// HELPER FUNCTIONS

function return_json($data)
{
    global $api_encrypt;
    $encryption_key = sha1("SECUREKEY");
    header("ETag: W/\"" . $encryption_key . "\"");

    switch ($api_encrypt['mode']) {
        case "full":
            echo rc4(xor_string(gzdeflate(xor_string(json_encode($data), "cutie smile airi airi haruka 41541100"), 9), strrev("azusawa kohane 13391339")), $encryption_key);
            break;
        case "light":
            echo xor_string(json_encode($data), "\x0f");
            break;
        default:
            echo json_encode($data);
            break;
    }
}

function get_obfuscated_file($filename, $build_type="prod")
{
    global $javascript_filename, $javascript_alpha_filename;
    // used in index.php, to return obfuscated files
    if ($build_type == "prod") {
        $content = explode("\n", file_get_contents($javascript_filename));
        $hash = array_shift($content);

        header("ETag: W/\"" . $hash . "\"");
        $content = implode("\n", $content);
        echo $content;
    }
    if ($build_type == "alpha") {
        $content = explode("\n", file_get_contents($javascript_alpha_filename));
        $hash = array_shift($content);
        header("ETag: W/\"" . $hash . "\"");
        $content = implode("\n", $content);
        echo $content;
    }
}

function fetch_current_event()
{
    // fetch current event and return array
    return json_decode(@file_get_contents("http://" . API_DOMAIN . "/current_event", false), true);
}

function fetch_current_bloom()
{
    // fetch current WL and return array
    $res = json_decode(@file_get_contents("http://" . API_DOMAIN . "/current_bloom", false), true);
    $result = [];
    foreach ($res as $record) {
        $event_id = (int) $record['eventId'];
        $character_id = (int) $record['gameCharacterId'];
        if (!@$result[$event_id]) {
            $result[$event_id] = [];
        }
        $result[$event_id][$character_id] = [
            "chapter_start" => $record['chapterStartAt'] / 1000,
            "chapter_end" => $record['aggregateAt'] / 1000,
        ];
    }

    return $result;
}

function init_mysqli()
{
    global $mysqli;

    try{
        if (!$mysqli) {
            $mysqli = new mysqli(
                "mariadb.internal",
                "sekai",
                "sekai",
                "sekai",
            );
        }
    } catch (Exception $e) {
        return false;
    }

    if (!$mysqli || $mysqli->connect_error) {
        return false;
    }

    return true;
}

function init_redis()
{
    global $redis;

    try{
        if(!$redis){
            $redis = new Redis([
                'host' => 'valkey.internal',
                'port' => 6379,
                'connectTimeout' => 3,
                'auth' => ['REDACTED'],
                'backoff' => [
                    'algorithm' => Redis::BACKOFF_ALGORITHM_DECORRELATED_JITTER,
                    'base' => 500,
                    'cap' => 750,
                ],
            ]);
            $redis->select(2);
        }
        return true;
    } catch (Exception $e) {
        return false;
    }
}

function logging($user_id, $message)
{
    global $mysqli, $ip;

    if(!init_mysqli()) return false;
    $stmt = $mysqli->prepare("INSERT INTO logs VALUES (NULL, NOW(), ?, ?, ?);");
    $stmt->bind_param("sss", $ip, $user_id, $message);
    $stmt->execute();

    return true;
}

//////////////////////////// AUTHENTICATION METHODS

function do_register($post)
{
    global $ip, $invite_codes, $mysqli;
    if(!init_mysqli()) die("service_dead");
    header("Content-Type: text/plain");

    $user_id = trim((string)$post['username']);
    $user_pw = (string)$post['password'];
    $user_invite = (string)$post['inviteCode'];
    $user_friend = (int) $post['friendCode'];
    $user_ip = (string)substr($ip, 0, 255);
    $user_ua = (string)substr($_SERVER['HTTP_USER_AGENT'], 0, 255);

    // basic validation checks
    if (!(strlen($user_id) >= 4 &&
          strlen($user_id) <= 64)) {
        $mysqli->close();
        die("validation_error");
    }
    if (trim($user_pw, '0..9A..Fa..f') != '' ||
        strlen($user_pw) >= 256 ||
        strlen($user_pw) < 128) {
        $mysqli->close();
        die("validation_error");
    }
    if (!in_array($user_invite, $invite_codes)) {
        $mysqli->close();
        die("incorrect_invite");
    }
    if (!$user_friend) {
        $mysqli->close();
        die("validation_error");
    }

    $turnstile_response = (string)$post['cf-turnstile-response'];
    $turnstile_validation = validateTurnstile(
        $turnstile_response,
        SECRET_KEY_TURNSTILE,
        $ip
    );

    if (!$turnstile_validation['success']) {
        $mysqli->close();
        die("captcha");
    }

    // user duplicate check, friend duplicate check
    $stmt = $mysqli->prepare("SELECT * FROM users WHERE user_username=? OR user_friend_code=? LIMIT 1");
    $stmt->bind_param('ss', $user_id, $user_friend);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();
    if($res){
        $message = "regist: duplicate account ($user_id)";
        logging($user_id, $message);
        $mysqli->close();
        die("duplicate_account");
    }

    // registration with argon2id
    $user_pw = password_hash($user_pw, PASSWORD_ARGON2ID, [
        "memory_cost" => 2 * PASSWORD_ARGON2_DEFAULT_MEMORY_COST,
        "time_cost" => 1,
        "threads" => 4,
    ]);

    $stmt = $mysqli->prepare("INSERT INTO users VALUES (NULL, ?, ?, ?, ?, 0, NOW(), NULL, ?, ?, '', NULL)");
    $stmt->bind_param('ssssss', $user_id, $user_pw, $user_friend, $user_invite, $user_ip, $user_ua);
    $stmt->execute();

    $message = "regist: successful";
    logging($user_id, $message);

    $messages = [
        "content" => "<@346163688102821888> <@1076037191471464498>\n\nUser ID: `$user_id`\nFriend Code: `$user_friend`\nInvite Code: `$user_invite`\nIP: `$user_ip`\nUA: `$user_ua`",
        "username" => "sekai-run-bot",
    ];
    $result = @sendDiscordWebhook(
        webhookUrl: "https://discord.com/api/FIXME5",
        payload: $messages,
    );

    $mysqli->close();
    die("done");
}

function do_login($post){
    global $ip, $redis, $mysqli;
    header("Content-Type: text/plain");
    if(!init_mysqli()) die("service_dead");
    if(!init_redis()) die("service_dead");

    $user_id = trim((string)$post['username']);
    $user_pw = (string)$post['password'];

    // basic validation checks
    if (!(strlen($user_id) >= 4 &&
          strlen($user_id) <= 64)) {
        $mysqli->close();
        die("validation_error");
    }

    if (trim($user_pw, '0..9A..Fa..f') != '' ||
        strlen($user_pw) >= 256 ||
        strlen($user_pw) < 128) {
        $mysqli->close();
        die("validation_error");
    }

    $turnstile_response = (string)$post['cf-turnstile-response'];
    $turnstile_validation = validateTurnstile(
        $turnstile_response,
        SECRET_KEY_TURNSTILE,
        $ip
    );
    if (!$turnstile_validation['success']) {
        $mysqli->close();
        die("captcha");
    }

    $stmt = $mysqli->prepare("SELECT * FROM users WHERE user_username=? LIMIT 1");
    $stmt->bind_param('s', $user_id);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();

    if (!$res) {
        $mysqli->close();
        die("incorrect_account");
    }

    if ($res['user_username'] != $user_id ||
        $res['user_username'] !== $user_id) {
        $message = "login; incorrect username ($user_id)";
        logging($user_id, $message);
        $mysqli->close();
        die("incorrect_account");
    }

    if (!password_verify($user_pw, $res['user_password'])) {
        $message = "login: incorrect password";
        logging($user_id, $message);
        $mysqli->close();
        die("incorrect_account");
    }

    // update last login information
    $stmt = $mysqli->prepare("UPDATE users SET user_date_login=NOW(), user_current_session=? WHERE user_username=?");
    $stmt->bind_param('ss', session_id(), $user_id);
    $stmt->execute();
    $redis->set($res['user_id'], session_id());

    if ($res['user_permission'] == 0) {
        $message = "login: failed (permission error)";
        logging($user_id, $message);
        $mysqli->close();
        die("awaiting||" . $res['user_comment']);
    }

    if ($res['user_permission'] == 4) {
        $message = "login: failed (rejected user)";
        logging($user_id, $message);
        $mysqli->close();
        die("rejected||" . $res['user_comment']);
    }

    if ($res['user_permission'] == 3) {
        $message = "login: failed (blocked user)";
        logging($user_id, $message);
        $mysqli->close();
        die("banned||" . $res['user_comment']);
    }

    $message = "login: successful";
    logging($user_id, $message);

    $_SESSION['uid'] = $res['user_id'];
    $_SESSION['username'] = $res['user_username'];
    $_SESSION['friend_code'] = $res['user_friend_code'];
    $_SESSION['invite_code'] = $res['user_invite_code'];
    $_SESSION['permission'] = (int)$res['user_permission'];

    $mysqli->close();
    die("done");
}

function users_statistics(){
    global $mysqli;

    header("Content-Type: text/plain");
    if(!init_mysqli()) die("{}");

    $query = <<<EOF
        SELECT
            /* COUNT(*) AS count_total, */
            CAST(SUM(CASE WHEN user_permission=0 THEN 1 ELSE 0 END) AS INT) AS count_queue,
            CAST(SUM(CASE WHEN user_permission=3 OR user_permission=4 THEN 1 ELSE 0 END) AS INT) AS count_rejected,
            CAST(SUM(CASE WHEN user_permission>=5 THEN 1 ELSE 0 END) AS INT) AS count_normal
        FROM users
    EOF;

    $stmt = $mysqli->prepare($query);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();

    header("Content-Type: application/json");
    $res['now'] = time();
    echo json_encode($res);

    $mysqli->close();
}

function is_login()
{
    global $redis, $multitab_allowlist;
    if (!init_redis()) return false;

    if (!$_SESSION['username'] ||
        !$_SESSION['uid']) {
        return false;
    }

    // prevent multiple logins
    if ($redis->get($_SESSION['uid']) != session_id() &&
        !in_array($_SESSION['username'], $multitab_allowlist)) {
        logout();
        return false;
    }

    return true;
}

function permission_check($min_permission=5)
{
    if (!(is_login() &&
          $_SESSION['permission'] >= $min_permission)) {
        header("Cache-Control: no-store");
        header("Location: /");
        exit;
    }
}

function logout()
{
    setcookie(session_name(), '', 100);
    session_unset();
    session_destroy();
    $_SESSION = array();
    header("Location: /");
    exit;
}

?>
