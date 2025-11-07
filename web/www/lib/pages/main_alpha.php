<?php

if(!defined("SCOREBOARD")) die;

// check if beta

$is_beta  = false;
$is_alpha = false;

switch($build_type)
{
    case "beta":
        $is_beta = true;
        $javascript_revision = "beta-" . rand(1000, 999999999);
        $datadir = "/var/www/data/javascript_beta/";
        break;

    case "alpha":
        $is_alpha = true;
        $javascript_revision = "alpha-" . rand(1000, 999999999);
        $datadir = "/var/www/data/javascript_alpha/";
        break;

    default:
        $datadir = "/var/www/data/javascript/";
        break;
}

// render data
function get_render_scripts()
{
    global $is_beta, $is_alpha, $javascript_revision, $script_hashes;
    if($is_beta){
        return <<<EOF
        <script referrerpolicy="no-referrer" src="/static/airi_beta_114.js?revision=$javascript_revision" crossorigin="anonymous"></script>
        EOF;
    }
    if($is_alpha){
        return <<<EOF
        <script referrerpolicy="no-referrer" src="/static/${script_hashes['script_alpha']}?revision=$javascript_revision" crossorigin="anonymous"></script>
        EOF;
    }

    return <<<EOF
        <script referrerpolicy="no-referrer" src="/static/${script_hashes['script_prod']}.js?revision=$javascript_revision" crossorigin="anonymous"></script>
        <style>#bmc-wbtn { border-radius: 0.2em !important; width: 35px !important; height: 35px !important; } #bmc-iframe { border-radius: 0 !important; }</style>
        <script data-name="BMC-Widget" data-cfasync="false" src="/static/donate.js?revision=$javascript_revision" data-id="koha302" data-description="Buy me a coffee!" data-message="" data-color="#FF813F" data-position="Right" data-x_margin="15" data-y_margin="15"></script>
        EOF;
}

// load main template. but it needs to be a file and not link
$filename = $datadir . "main.tmpl";
if (file_exists($filename) && is_file($filename) && !is_link($filename)) {
    $template = file_get_contents($filename);
    $template = str_replace('$$JAVASCRIPT_REVISION$$', $javascript_revision, $template);
    $template = str_replace('$$JAVASCRIPT_RENDER$$', get_render_scripts(), $template);
}

echo $template;

?>
