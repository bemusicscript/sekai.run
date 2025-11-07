<?php

ini_set("output_buffering", "0");
define("SCOREBOARD", "yes");
require("lib/init.php");
require("lib/crypto.php");

ob_start();
$minify = false;
$ban_bypass = false;

// generate information cookie
function generate_information_cookie(){
    $settings = [
        'path' => '/',
        'domain' => '.sekai.run',
        'secure' => true,
        'httponly' => false,
        'samesite' => 'Lax',
        'expires' => time() + (3600 * 24 * 7)
    ];
    $data = [
        "uid" => $_SESSION['uid'],
        "fid" => profile_encrypt($_SESSION['friend_code']),
    ];
    setcookie("cf_information", base64_encode(json_encode($data)), $settings);
}

$shutdown_date = '2025-12-01';
$current_date = date('Y-m-d');
if ($current_date >= $shutdown_date) {
    require("lib/pages/eos.php");
    goto return_result;
}

switch(@$uri['path']){

    /* builds */
    case "/build/hash":
        permission_check(9);
        header("Content-Type: application/json");
        echo json_encode($script_hashes);
        break;

    case "/build/javascript/prod":
        permission_check(9);
        echo "<pre>";
        echo system("node lib/obfuscator.php ../data/javascript/all.js javascript skip_hash 2>&1");
        echo "</pre>";
        break;

    case "/build/javascript/alpha":
        permission_check(9);
        echo "<pre>";
        echo system("node lib/obfuscator.php ../data/javascript_alpha/all.js javascript_alpha skip_hash 2>&1");
        echo "</pre>";
        break;

    /* api */
    case "/api":
        $build_type = "prod";
        $api_encrypt['mode'] = "full";
        require("lib/api.php");
        break;

    case "/api/beta14":
        permission_check(8);
        $build_type = "beta";
        $debug_mode = true;
        $api_encrypt['mode'] = "full";
        require("lib/api_beta.php");
        break;

    case "/api/alpha":
        permission_check(8);
        $build_type = "alpha";
        $api_encrypt['mode'] = "full";
        require("lib/api_alpha.php");
        break;

    /* statics */
    case "/static/" . $script_hashes['script_prod'] . ".js":
        permission_check(5);
        header("Content-Type: application/javascript; charset=utf-8");
        get_obfuscated_file("all.js");
        break;

    case "/static/" . $script_hashes['script_alpha'] . ".js";
        permission_check(5);
        header("Content-Type: application/javascript; charset=utf-8");
        get_obfuscated_file("all.js", "alpha");
        break;

    case "/app.webmanifest":
        $ban_bypass = true;
        header("Content-Type: application/manifest+json");
        echo file_get_contents("../shared/public/manifest.json");
        break;

    case "/favicon.ico":
        $ban_bypass = true;
        header("Content-Type: image/png");
        echo file_get_contents("../shared/public/static/icon/icon.png");
        break;

    case "/robots.txt":
        $ban_bypass = true;
        header("Content-Type: text/plain; charset=utf-8");
        echo file_get_contents("../shared/public/robots.txt");
        break;

    /* healthcheck and logout */
    case "/hc":
        permission_check(5);
        echo "OK";
        break;

    case "/logout":
        permission_check(5);
        logout();
        break;

    /* beta info */
    case "/static/airi_beta_114.js":
        permission_check(8);
        header("Content-Type: application/javascript; charset=utf-8");
        $filenames = [
            "../data/javascript_beta/const.js",
            "../data/javascript_beta/lib.js",
            "../data/javascript_beta/control.js",
            "../data/javascript_beta/main.js",
        ];
        foreach($filenames as $filename){
            if (file_exists($filename) && is_file($filename) && !is_link($filename)) {
                echo file_get_contents($filename);
            }
        }
        break;

    case "/beta_114514":
        permission_check(8);
        $minify = true;
        $debug_mode = true;
        $build_type = "beta";
        generate_information_cookie();
        require("./lib/pages/main_beta.php");
        break;

    case "/twitter_recruit":
        $minify = true;
        require("./lib/pages/twitter_recruit.php");
        break;

    case "/latency":
        $minify = true;
        require("./lib/pages/latency.php");
        break;

    case "/statistics/users":
        users_statistics();
        break;

    default:
        // handling static
        if (str_starts_with($uri['path'], "/static/")) {
            static_handler($uri);
            break;
        }

        if (str_starts_with($uri['path'], "/assets/")) {
            character_asset_handler($uri);
            break;
        }

        $minify = true;
        if ($uri['path'] != "/") {
            require("../shared/public/error.php");
            break;
        }

        if (is_login()) {
            generate_information_cookie();
            require("./lib/pages/main.php");
            break;
        } else {
            switch ($_POST['action']) {
                case "register":
                    do_register($_POST);
                    break;
                case "login":
                    do_login($_POST);
                    break;
            }

            require("./lib/pages/login.php");
            break;
        }
}

return_result:
    $response = ob_get_contents();
    ob_end_clean();

    if ($debug_mode) {
        $script_time = microtime(true) - $script_time;
        header("X-Runtime: $script_time");
    }
    if (is_banned_ip($ip) && !$ban_bypass) {
        render_blocked();
    }

    if ($minify) {
        echo minify_response($response);
    } else {
        echo $response;
    }

?>
