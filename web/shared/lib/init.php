<?php



//////////////////////////// GLOBAL VARIABLES

define("API_DOMAIN", "api.internal:5000");
define("CURRENT_DENYLIST", "/var/www/data/.banned.ip.log");
define("CURRENT_ALLOWLIST", "/var/www/data/.allowed.ip.log");

$blocked_referers = [
//    "//story.kakao.com/",
//    "//link.naver.com",
//    "//keep.naver.com",
//    "//com.reddit.frontpage",
//    "//com.twitter.android",
//    "//m.facebook.com",
//    "//lm.facebook.com",
];

$debug_domains = [
    "http://beta.dev.sekai.run",
    "https://beta.dev.sekai.run",
];

$production_domains = [
    "http://my.sekai.run",
    "https://my.sekai.run",
    "http://sekai.run",
    "https://sekai.run",
];

$allowed_domains = array_merge($debug_domains, $production_domains);

//////////////////////////// LOAD SHARED FUNCTIONS

require("../shared/lib/is_bot.php");
require("../shared/lib/functions.php");

//////////////////////////// SERVICE INIT

date_default_timezone_set("Asia/Tokyo");
$script_time = microtime(true);
if (php_sapi_name() === 'cli')
{
    ini_set("display_errors", "on");
    error_reporting(7);
    echo "[*] You are in CLI mode. Debugging is enabled.\n";
}

set_time_limit(0);
ini_set("default_socket_timeout", 60);

$uri = parse_url($_SERVER['REQUEST_URI']);
$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ? $_SERVER['HTTP_CF_CONNECTING_IP'] : $_SERVER['REMOTE_ADDR'];
$ip_country = $_SERVER["HTTP_CF_IPCOUNTRY"];
$http_referer = $_SERVER["HTTP_REFERER"];

// check if on debug mode
$debug_mode = false;
if (in_array(@$_SERVER['HTTP_ORIGIN'], $debug_domains))
{
    $debug_mode = true;
}

// check if origin is within the allowed list
if (in_array(@$_SERVER['HTTP_ORIGIN'], $allowed_domains))
{
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Expose-Headers: *");
}

//////////////////////////// BAN CHECK

// bot check - https://github.com/fabiomb/is_bot
if (is_bot($_SERVER['HTTP_USER_AGENT']))
{
    set_banned_ip($ip, $ip_country, "bot detected - " . $_SERVER['HTTP_USER_AGENT']);
    http_response_code(418);
    render_blocked();
}

// render blocked if blocked
if ($_SERVER['QUERY_STRING'] == "gcq12" || $_SERVER['QUERY_STRING'] == "gcq12")
{
    // if gcq sticky bit is detected then autoblock
    set_banned_ip($ip, $ip_country, $_SERVER['QUERY_STRING']);
    render_blocked();
}

// block illegal referers
foreach($blocked_referers as $blocked_referer)
{
    if (str_contains($http_referer, $blocked_referer)) {
        set_banned_ip($ip, $ip_country, " Pattern: " . $blocked_referer . " / Referer:" . $http_referer);
        render_blocked();
    }
}

// block access from Kakaotalk
if(str_contains($_SERVER['HTTP_USER_AGENT'], "KAKAOTALK")){
    set_banned_ip($ip, $ip_country, "KakaoTalk - " . $_SERVER['HTTP_USER_AGENT']);
    render_blocked();
}

?>
