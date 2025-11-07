<?php

ini_set("output_buffering", "0");
define("MYSEKAI", "yes");
require("lib/init.php");

ob_start();
$ban_bypass = false;
$minify = false;

switch(@$uri['path']){
    case "/ikea":
    case "/ikea/":
        $minify = true;
        require("./lib/pages/ikea.php");
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

    case "/ikea.json":
        header("Content-Type: application/json; charset=utf-8");
        $filename = "../mysekai_assets/ikea.json";
        $modified_time = filemtime($filename);
        header("Last-Modified: " . gmdate('D, d M Y H:i:s T', $modified_time));
        echo file_get_contents($filename);
        break;

    default:
        // handling mysekai assets
        if(str_starts_with($uri['path'], "/assets/")){
            mysekai_asset_handler($uri);
            break;
        }

        // handling static
        if(str_starts_with($uri['path'], "/static/")){
            static_handler($uri);
            break;
        }

        // minify error page and index page
        $minify = true;
        if($uri['path'] != "/"){
            require("../shared/public/error.php");
            break;
        }
        $minify = true;
        require("./lib/pages/main.php");
        break;
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
    }else{
        echo $response;
    }

?>
