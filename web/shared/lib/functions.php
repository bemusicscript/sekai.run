<?php

/* Static file handler */

function mysekai_asset_handler($uri)
{
    $sorry_image = "../shared/public/static/sorry.png";
    $asset_list = json_decode(file_get_contents("../mysekai_assets/_fixturesHash.json"), true);
    $asset_filename = (string) explode("/", $uri['path'])[2];

    // check if file exists, otherwise render sorry
    header("Content-Type: image/webp");
    if ($asset_list[$asset_filename]) {
        $bundle_filename = "../mysekai_assets/" . $asset_list[$asset_filename]['bundle_path'];
    } else {
        $bundle_filename = $sorry_image;
    }

    // if symlink or dir, just show sorry
    if(!is_file($bundle_filename)) $bundle_filename = $sorry_image;

    $modified_time = filemtime($bundle_filename);
    $modified_time = gmdate('D, d M Y H:i:s T', $modified_time);
    header("Last-Modified: " . $modified_time);
    header("Content-Length: " . filesize($bundle_filename));
    if ($bundle_filename == $sorry_image) {
        http_response_code(404);
        header('Cache-control: max-age=' . (86400 * 0));
    } else {
        header('Cache-control: public, max-age=' . (86400 * 60) . ', immutable');
    }
    readfile($bundle_filename);
    return;
}

function character_asset_handler($uri)
{
    $sorry_image = "../shared/public/static/sorry.png";
    $character_list = array_diff(scandir("../character_assets/member_cutout"), [".", ".."]);
    $character_card_id = (string) @explode("/", $uri['path'])[2];
    $character_card_type = (string) @explode("/", $uri['path'])[3];

    // check if asset exists
    if(!in_array($character_card_id, $character_list)){
        header('Cache-control: max-age=' . (86400 * 0));
        $minify = true;
        require("../shared/public/error.php");
        return;
    }

    // simple string check
    foreach (["..", "%2e%2e", "./", "%2e%2f", ".\\", "\\", "\0"] as $check) {
        if (str_contains($static_filename, $check)) {
            header('Cache-control: max-age=' . (86400 * 0));
            $minify = true;
            require("../shared/public/error.php");
            return;
        }
    }

    if ($character_card_type == "after_training") {
        $card_path = "/after_training.webp";
        //  $card_path = "/player_cell_result.webp";
    } else {
        $card_path = "/normal.webp";
        //$card_path = "/thumbnail_xl.webp";
    }

    // check if file exists, otherwise render sorry
    $bundle_filename = "../character_assets/member_cutout/" . $character_card_id . $card_path;
    if(!is_file($bundle_filename)) $bundle_filename = $sorry_image;

    header("Content-Type: image/webp");
    $modified_time = filemtime($bundle_filename);
    $modified_time = gmdate('D, d M Y H:i:s T', $modified_time);
    header("Last-Modified: " . $modified_time);
    header("Content-Length: " . filesize($bundle_filename));

    if ($bundle_filename == $sorry_image) {
        http_response_code(404);
        header('Cache-control: max-age=' . (86400 * 0));
    } else {
        header('Cache-control: public, max-age=' . (86400 * 60) . ', immutable');
    }
    readfile($bundle_filename);
    return;
}

function static_handler($uri)
{
    $static_filename = explode("/", $uri['path']);
    array_shift($static_filename);
    array_shift($static_filename);

    $static_filename = (string) implode("/", $static_filename);
    $static_extension = pathinfo($static_filename, PATHINFO_EXTENSION);

    // simple string check
    foreach (["..", "%2e%2e", "./", "%2e%2f", ".\\", "\\", "\0"] as $check) {
        if (str_contains($static_filename, $check)) {
            $minify = true;
            require("../shared/public/error.php");
            return;
        }
    }

    // base check
    $basepath = "../shared/public/static/";
    $realBase = realpath($basepath);
    $userpath = $basepath . $static_filename;
    $realUserPath = realpath($userpath);
    if ($realUserPath === false || strpos($realUserPath, $realBase) !== 0) {
        $minify = true;
        require("../shared/public/error.php");
        return;
    }
    $static_filename = $userpath;

    // read file
    if (!is_file($static_filename) || is_link($static_filename)) {
        $minify = true;
        require("../shared/public/error.php");
        return;
    }
    $modified_time = filemtime($static_filename);
    $modified_time = gmdate('D, d M Y H:i:s T', $modified_time);
    header("Content-Type: " . ext2mime($static_extension));
    header("Last-Modified: " . $modified_time);
    header("Content-Length: " . filesize($static_filename));
    header('Cache-control: public, max-age=' . (86400 * 30) . ', immutable');
    readfile($static_filename);
    return;
}

/* Encryptions / encoding */

function xor_string($string, $key)
{
    // xor two strings
    $keyLength = strlen($key);
    for($i = 0; $i < strlen($string); $i++)
        $string[$i] = ($string[$i] ^ $key[$i % $keyLength]);
    return $string;
}

function generate_random_string($length = 10)
{
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomBytes = random_bytes($length);
    $randomString = '';

    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[ord($randomBytes[$i]) % $charactersLength];
    }

    return $randomString;
}

function rc4($data, $key)
{
    $keyLength = strlen($key);
    $dataLength = strlen($data);

    $S = range(0, 255);
    $j = 0;

    for ($i = 0; $i < 256; $i++) {
        $j = ($j + $S[$i] + ord($key[$i % $keyLength])) & 0xFF;
        // Swap S[i] and S[j]
        $tmp = $S[$i];
        $S[$i] = $S[$j];
        $S[$j] = $tmp;
    }

    $i = 0;
    $j = 0;
    $result = '';

    for ($k = 0; $k < $dataLength; $k++) {
        $i = ($i + 1) & 0xFF;
        $j = ($j + $S[$i]) & 0xFF;
        // Swap S[i] and S[j]
        $tmp = $S[$i];
        $S[$i] = $S[$j];
        $S[$j] = $tmp;
        // XOR the data with the keystream byte
        $result .= $data[$k] ^ chr($S[($S[$i] + $S[$j]) & 0xFF]);
    }

    return $result;
}

/* Block related function */

function render_blocked(){
    // render blocked page if the IP is blocked
    header("Content-Type: text/html");
    require("../shared/public/blocked.php");
    die;
}

function is_banned_ip($ip){
    $fp = file_get_contents(CURRENT_DENYLIST);
    return (bool) str_contains(strtolower($fp), strtolower($ip));
}

function is_allowed_ip($ip){
    $fp = file_get_contents(CURRENT_ALLOWLIST);

    // check contents
    $checklist = explode("\n", $fp);
    foreach ($checklist as $item) {
        $item = strtolower($item);
        if (!trim($item)) continue;
        if (str_contains($item, $ip)) {
            return true;
        }

        // if the IP is v6, we can prob allow this
        if (strpos(":", $item) !== -1) {
            if (str_starts_with($ip, $item)) {
                return true;
            }
        }
    }
    return false;
}

function set_banned_ip($ip, $country="", $reason){
    $fp = fopen(CURRENT_DENYLIST, "a+");
    fwrite($fp,  "[" . date("Y-m-d H:i:s") . "] IP: " . $ip . " / Country: " . $country . " / Reason: ". $reason . "\n");
    fclose($fp);
}

/* Finding file types */
/* https://stackoverflow.com/questions/16511021/convert-mime-type-to-file-extension-php */

function get_finfo_mimetype($filename)
{
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $filename);
    finfo_close($finfo);
    return $mime;
}

function ext2mime($ext)
{
    $mime_map = [
        'video/3gpp2'                                                               => '3g2',
        'video/3gp'                                                                 => '3gp',
        'video/3gpp'                                                                => '3gp',
        'application/x-compressed'                                                  => '7zip',
        'audio/x-acc'                                                               => 'aac',
        'audio/ac3'                                                                 => 'ac3',
        'application/postscript'                                                    => 'ai',
        'audio/x-aiff'                                                              => 'aif',
        'audio/aiff'                                                                => 'aif',
        'audio/x-au'                                                                => 'au',
        'video/x-msvideo'                                                           => 'avi',
        'video/msvideo'                                                             => 'avi',
        'video/avi'                                                                 => 'avi',
        'application/x-troff-msvideo'                                               => 'avi',
        'application/macbinary'                                                     => 'bin',
        'application/mac-binary'                                                    => 'bin',
        'application/x-binary'                                                      => 'bin',
        'application/x-macbinary'                                                   => 'bin',
        'image/bmp'                                                                 => 'bmp',
        'image/x-bmp'                                                               => 'bmp',
        'image/x-bitmap'                                                            => 'bmp',
        'image/x-xbitmap'                                                           => 'bmp',
        'image/x-win-bitmap'                                                        => 'bmp',
        'image/x-windows-bmp'                                                       => 'bmp',
        'image/ms-bmp'                                                              => 'bmp',
        'image/x-ms-bmp'                                                            => 'bmp',
        'application/bmp'                                                           => 'bmp',
        'application/x-bmp'                                                         => 'bmp',
        'application/x-win-bitmap'                                                  => 'bmp',
        'application/cdr'                                                           => 'cdr',
        'application/coreldraw'                                                     => 'cdr',
        'application/x-cdr'                                                         => 'cdr',
        'application/x-coreldraw'                                                   => 'cdr',
        'image/cdr'                                                                 => 'cdr',
        'image/x-cdr'                                                               => 'cdr',
        'zz-application/zz-winassoc-cdr'                                            => 'cdr',
        'application/mac-compactpro'                                                => 'cpt',
        'application/pkix-crl'                                                      => 'crl',
        'application/pkcs-crl'                                                      => 'crl',
        'application/x-x509-ca-cert'                                                => 'crt',
        'application/pkix-cert'                                                     => 'crt',
        'text/css'                                                                  => 'css',
        'text/x-comma-separated-values'                                             => 'csv',
        'text/comma-separated-values'                                               => 'csv',
        'application/vnd.msexcel'                                                   => 'csv',
        'application/x-director'                                                    => 'dcr',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'   => 'docx',
        'application/x-dvi'                                                         => 'dvi',
        'message/rfc822'                                                            => 'eml',
        'application/x-msdownload'                                                  => 'exe',
        'video/x-f4v'                                                               => 'f4v',
        'audio/x-flac'                                                              => 'flac',
        'video/x-flv'                                                               => 'flv',
        'image/gif'                                                                 => 'gif',
        'application/gpg-keys'                                                      => 'gpg',
        'application/x-gtar'                                                        => 'gtar',
        'application/x-gzip'                                                        => 'gzip',
        'application/mac-binhex40'                                                  => 'hqx',
        'application/mac-binhex'                                                    => 'hqx',
        'application/x-binhex40'                                                    => 'hqx',
        'application/x-mac-binhex40'                                                => 'hqx',
        'text/html'                                                                 => 'html',
        'image/x-icon'                                                              => 'ico',
        'image/x-ico'                                                               => 'ico',
        'image/vnd.microsoft.icon'                                                  => 'ico',
        'text/calendar'                                                             => 'ics',
        'application/java-archive'                                                  => 'jar',
        'application/x-java-application'                                            => 'jar',
        'application/x-jar'                                                         => 'jar',
        'image/jp2'                                                                 => 'jp2',
        'video/mj2'                                                                 => 'jp2',
        'image/jpx'                                                                 => 'jp2',
        'image/jpm'                                                                 => 'jp2',
        'image/jpeg'                                                                => 'jpeg',
        'image/pjpeg'                                                               => 'jpeg',
        'application/x-javascript'                                                  => 'js',
        'application/json'                                                          => 'json',
        'text/json'                                                                 => 'json',
        'application/vnd.google-earth.kml+xml'                                      => 'kml',
        'application/vnd.google-earth.kmz'                                          => 'kmz',
        'text/x-log'                                                                => 'log',
        'audio/x-m4a'                                                               => 'm4a',
        'audio/mp4'                                                                 => 'm4a',
        'application/vnd.mpegurl'                                                   => 'm4u',
        'audio/midi'                                                                => 'mid',
        'application/vnd.mif'                                                       => 'mif',
        'video/quicktime'                                                           => 'mov',
        'video/x-sgi-movie'                                                         => 'movie',
        'audio/mpeg'                                                                => 'mp3',
        'audio/mpg'                                                                 => 'mp3',
        'audio/mpeg3'                                                               => 'mp3',
        'audio/mp3'                                                                 => 'mp3',
        'video/mp4'                                                                 => 'mp4',
        'video/mpeg'                                                                => 'mpeg',
        'application/oda'                                                           => 'oda',
        'audio/ogg'                                                                 => 'ogg',
        'video/ogg'                                                                 => 'ogg',
        'application/ogg'                                                           => 'ogg',
        'font/otf'                                                                  => 'otf',
        'application/x-pkcs10'                                                      => 'p10',
        'application/pkcs10'                                                        => 'p10',
        'application/x-pkcs12'                                                      => 'p12',
        'application/x-pkcs7-signature'                                             => 'p7a',
        'application/pkcs7-mime'                                                    => 'p7c',
        'application/x-pkcs7-mime'                                                  => 'p7c',
        'application/x-pkcs7-certreqresp'                                           => 'p7r',
        'application/pkcs7-signature'                                               => 'p7s',
        'application/pdf'                                                           => 'pdf',
        'application/octet-stream'                                                  => 'pdf',
        'application/x-x509-user-cert'                                              => 'pem',
        'application/x-pem-file'                                                    => 'pem',
        'application/pgp'                                                           => 'pgp',
        'application/x-httpd-php'                                                   => 'php',
        'application/php'                                                           => 'php',
        'application/x-php'                                                         => 'php',
        'text/php'                                                                  => 'php',
        'text/x-php'                                                                => 'php',
        'application/x-httpd-php-source'                                            => 'php',
        'image/png'                                                                 => 'png',
        'image/x-png'                                                               => 'png',
        'application/powerpoint'                                                    => 'ppt',
        'application/vnd.ms-powerpoint'                                             => 'ppt',
        'application/vnd.ms-office'                                                 => 'ppt',
        'application/msword'                                                        => 'doc',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
        'application/x-photoshop'                                                   => 'psd',
        'image/vnd.adobe.photoshop'                                                 => 'psd',
        'audio/x-realaudio'                                                         => 'ra',
        'audio/x-pn-realaudio'                                                      => 'ram',
        'application/x-rar'                                                         => 'rar',
        'application/rar'                                                           => 'rar',
        'application/x-rar-compressed'                                              => 'rar',
        'audio/x-pn-realaudio-plugin'                                               => 'rpm',
        'application/x-pkcs7'                                                       => 'rsa',
        'text/rtf'                                                                  => 'rtf',
        'text/richtext'                                                             => 'rtx',
        'video/vnd.rn-realvideo'                                                    => 'rv',
        'application/x-stuffit'                                                     => 'sit',
        'application/smil'                                                          => 'smil',
        'text/srt'                                                                  => 'srt',
        'image/svg+xml'                                                             => 'svg',
        'application/x-shockwave-flash'                                             => 'swf',
        'application/x-tar'                                                         => 'tar',
        'application/x-gzip-compressed'                                             => 'tgz',
        'image/tiff'                                                                => 'tiff',
        'font/ttf'                                                                  => 'ttf',
        'text/plain'                                                                => 'txt',
        'text/x-vcard'                                                              => 'vcf',
        'application/videolan'                                                      => 'vlc',
        'text/vtt'                                                                  => 'vtt',
        'audio/x-wav'                                                               => 'wav',
        'audio/wave'                                                                => 'wav',
        'audio/wav'                                                                 => 'wav',
        'application/wbxml'                                                         => 'wbxml',
        'video/webm'                                                                => 'webm',
        'image/webp'                                                                => 'webp',
        'audio/x-ms-wma'                                                            => 'wma',
        'application/wmlc'                                                          => 'wmlc',
        'video/x-ms-wmv'                                                            => 'wmv',
        'video/x-ms-asf'                                                            => 'wmv',
        'font/woff'                                                                 => 'woff',
        'font/woff2'                                                                => 'woff2',
        'application/xhtml+xml'                                                     => 'xhtml',
        'application/excel'                                                         => 'xl',
        'application/msexcel'                                                       => 'xls',
        'application/x-msexcel'                                                     => 'xls',
        'application/x-ms-excel'                                                    => 'xls',
        'application/x-excel'                                                       => 'xls',
        'application/x-dos_ms_excel'                                                => 'xls',
        'application/xls'                                                           => 'xls',
        'application/x-xls'                                                         => 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'         => 'xlsx',
        'application/vnd.ms-excel'                                                  => 'xlsx',
        'application/xml'                                                           => 'xml',
        'text/xml'                                                                  => 'xml',
        'text/xsl'                                                                  => 'xsl',
        'application/xspf+xml'                                                      => 'xspf',
        'application/x-compress'                                                    => 'z',
        'application/x-zip'                                                         => 'zip',
        'application/zip'                                                           => 'zip',
        'application/x-zip-compressed'                                              => 'zip',
        'application/s-compressed'                                                  => 'zip',
        'multipart/x-zip'                                                           => 'zip',
        'text/x-scriptzsh'                                                          => 'zsh',
        'text/markdown'                                                             => 'md',
    ];

    // Build a reversed mapping: extension => mime type.
    $ext_map = [];
    foreach ($mime_map as $mime => $extension) {
        // Only set the mime type if the extension is not already defined.
        // This way, the first encountered mime type for a given extension is used.
        if (!isset($ext_map[$extension])) {
            $ext_map[$extension] = $mime;
        }
    }

    $ext = strtolower($ext);
    return isset($ext_map[$ext]) ? $ext_map[$ext] : "text/plain";
}

// Minify: https://gist.github.com/Rodrigo54/93169db48194d470188f
function minify_response($input) {
    if(trim($input) === "") return $input;
    // Remove extra white-space(s) between HTML attribute(s)
    $input = preg_replace_callback('#<([^\/\s<>!]+)(?:\s+([^<>]*?)\s*|\s*)(\/?)>#s', function($matches) {
        return '<' . $matches[1] . preg_replace('#([^\s=]+)(\=([\'"]?)(.*?)\3)?(\s+|$)#s', ' $1$2', $matches[2]) . $matches[3] . '>';
    }, str_replace("\r", "", $input));
    // Minify inline CSS declaration(s)
    if(strpos($input, ' style=') !== false) {
        $input = preg_replace_callback('#<([^<]+?)\s+style=([\'"])(.*?)\2(?=[\/\s>])#s', function($matches) {
            return '<' . $matches[1] . ' style=' . $matches[2] . minify_css($matches[3]) . $matches[2];
        }, $input);
    }
    if(strpos($input, '</style>') !== false) {
      $input = preg_replace_callback('#<style(.*?)>(.*?)</style>#is', function($matches) {
        return '<style' . $matches[1] .'>'. minify_css($matches[2]) . '</style>';
      }, $input);
    }
    if(strpos($input, '</script>') !== false) {
      $input = preg_replace_callback('#<script(.*?)>(.*?)</script>#is', function($matches) {
        return '<script' . $matches[1] .'>'. minify_js($matches[2]) . '</script>';
      }, $input);
    }

    return preg_replace(
        array(
            // t = text
            // o = tag open
            // c = tag close
            // Keep important white-space(s) after self-closing HTML tag(s)
            '#<(img|input)(>| .*?>)#s',
            // Remove a line break and two or more white-space(s) between tag(s)
            '#(<!--.*?-->)|(>)(?:\n*|\s{2,})(<)|^\s*|\s*$#s',
            '#(<!--.*?-->)|(?<!\>)\s+(<\/.*?>)|(<[^\/]*?>)\s+(?!\<)#s', // t+c || o+t
            '#(<!--.*?-->)|(<[^\/]*?>)\s+(<[^\/]*?>)|(<\/.*?>)\s+(<\/.*?>)#s', // o+o || c+c
            '#(<!--.*?-->)|(<\/.*?>)\s+(\s)(?!\<)|(?<!\>)\s+(\s)(<[^\/]*?\/?>)|(<[^\/]*?\/?>)\s+(\s)(?!\<)#s', // c+t || t+o || o+t -- separated by long white-space(s)
            '#(<!--.*?-->)|(<[^\/]*?>)\s+(<\/.*?>)#s', // empty tag
            '#<(img|input)(>| .*?>)<\/\1>#s', // reset previous fix
            '#(&nbsp;)&nbsp;(?![<\s])#', // clean up ...
            '#(?<=\>)(&nbsp;)(?=\<)#', // --ibid
            // Remove HTML comment(s) except IE comment(s)
            '#\s*<!--(?!\[if\s).*?-->\s*|(?<!\>)\n+(?=\<[^!])#s'
        ),
        array(
            '<$1$2</$1>',
            '$1$2$3',
            '$1$2$3',
            '$1$2$3$4$5',
            '$1$2$3$4$5$6$7',
            '$1$2$3',
            '<$1$2',
            '$1 ',
            '$1',
            ""
        ),
    $input);
}

// CSS Minifier => http://ideone.com/Q5USEF + improvement(s)
function minify_css($input) {
    if(trim($input) === "") return $input;
    return preg_replace(
        array(
            // Remove comment(s)
            '#("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\')|\/\*(?!\!)(?>.*?\*\/)|^\s*|\s*$#s',
            // Remove unused white-space(s)
            '#("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\'|\/\*(?>.*?\*\/))|\s*+;\s*+(})\s*+|\s*+([*$~^|]?+=|[{};,>~]|\s(?![0-9\.])|!important\b)\s*+|([[(:])\s++|\s++([])])|\s++(:)\s*+(?!(?>[^{}"\']++|"(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\')*+{)|^\s++|\s++\z|(\s)\s+#si',
            // Replace `0(cm|em|ex|in|mm|pc|pt|px|vh|vw|%)` with `0`
            '#(?<=[\s:])(0)(cm|em|ex|in|mm|pc|pt|px|vh|vw|%)#si',
            // Replace `:0 0 0 0` with `:0`
            '#:(0\s+0|0\s+0\s+0\s+0)(?=[;\}]|\!important)#i',
            // Replace `background-position:0` with `background-position:0 0`
            '#(background-position):0(?=[;\}])#si',
            // Replace `0.6` with `.6`, but only when preceded by `:`, `,`, `-` or a white-space
            '#(?<=[\s:,\-])0+\.(\d+)#s',
            // Minify string value
            '#(\/\*(?>.*?\*\/))|(?<!content\:)([\'"])([a-z_][a-z0-9\-_]*?)\2(?=[\s\{\}\];,])#si',
            '#(\/\*(?>.*?\*\/))|(\burl\()([\'"])([^\s]+?)\3(\))#si',
            // Minify HEX color code
            '#(?<=[\s:,\-]\#)([a-f0-6]+)\1([a-f0-6]+)\2([a-f0-6]+)\3#i',
            // Replace `(border|outline):none` with `(border|outline):0`
            '#(?<=[\{;])(border|outline):none(?=[;\}\!])#',
            // Remove empty selector(s)
            '#(\/\*(?>.*?\*\/))|(^|[\{\}])(?:[^\s\{\}]+)\{\}#s'
        ),
        array(
            '$1',
            '$1$2$3$4$5$6$7',
            '$1',
            ':0',
            '$1:0 0',
            '.$1',
            '$1$3',
            '$1$2$4$5',
            '$1$2$3',
            '$1:0',
            '$1$2'
        ),
    $input);
}

// JavaScript Minifier
function minify_js($input) {
    if(trim($input) === "") return $input;
    return preg_replace(
        array(
            // Remove comment(s)
            '#\s*("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\')\s*|\s*\/\*(?!\!|@cc_on)(?>[\s\S]*?\*\/)\s*|\s*(?<![\:\=])\/\/.*(?=[\n\r]|$)|^\s*|\s*$#',
            // Remove white-space(s) outside the string and regex
            '#("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\'|\/\*(?>.*?\*\/)|\/(?!\/)[^\n\r]*?\/(?=[\s.,;]|[gimuy]|$))|\s*([!%&*\(\)\-=+\[\]\{\}|;:,.<>?\/])\s*#s',
            // Remove the last semicolon
            '#;+\}#',
            // Minify object attribute(s) except JSON attribute(s). From `{'foo':'bar'}` to `{foo:'bar'}`
            '#([\{,])([\'])(\d+|[a-z_][a-z0-9_]*)\2(?=\:)#i',
            // --ibid. From `foo['bar']` to `foo.bar`
            '#([a-z0-9_\)\]])\[([\'"])([a-z_][a-z0-9_]*)\2\]#i'
        ),
        array(
            '$1',
            '$1$2',
            '}',
            '$1$3',
            '$1.$3'
        ),
    $input);
}

function sendDiscordWebhook(string $webhookUrl, array $payload, int $maxRetries = 3): bool
{

    $retryCount = 0;

    // =================================================================
    // RATE LIMIT RETRY LOOP
    // =================================================================
    while ($retryCount <= $maxRetries) {
        $ch = curl_init($webhookUrl);

        // =============================================================
        // CURL BASE CONFIGURATION
        // =============================================================
        $options = [
            CURLOPT_FOLLOWLOCATION => true,   // Follow redirects (301/302)
            CURLOPT_HEADER => true,           // Include headers in response
            CURLOPT_RETURNTRANSFER => true,   // Return transfer instead of output
            CURLOPT_TIMEOUT => 120,           // Maximum execution time (seconds)
            CURLOPT_SSL_VERIFYPEER => true,   // Verify SSL certificate
            CURLOPT_POST => true,             // Always use POST method
        ];

        $options[CURLOPT_HTTPHEADER] = ['Content-Type: application/json'];
        $options[CURLOPT_POSTFIELDS] = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        curl_setopt_array($ch, $options);
        $response = curl_exec($ch);

        if ($response === false) {
            $error = curl_error($ch);
            $errno = curl_errno($ch);
            curl_close($ch);
            error_log("cURL error ($errno): $error");
            return false;
        }

        // =============================================================
        // RESPONSE PROCESSING
        // =============================================================
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $responseHeaders = substr($response, 0, $headerSize);
        $responseBody = substr($response, $headerSize);
        
        curl_close($ch);
        

        // =============================================================
        // SUCCESSFUL DELIVERY (2xx STATUS)
        // =============================================================
        if ($httpCode >= 200 && $httpCode < 300) {
            return true;
        }
        
        // =============================================================
        // RATE LIMIT HANDLING (429 TOO MANY REQUESTS)
        // =============================================================
        if ($httpCode === 429) {
            $retryAfter = 1;  // Default cooldown (in seconds)
            
            // Parse Retry-After header (seconds to wait)
            if (preg_match('/retry-after: (\d+)/i', $responseHeaders, $matches)) {
                $retryAfter = (int)$matches[1];
            } 
            // Fallback to Discord's rate-limit header
            elseif (preg_match('/x-ratelimit-reset-after: (\d+\.?\d*)/i', $responseHeaders, $matches)) {
                $retryAfter = (float)$matches[1];
            }
            
            error_log("Rate limit hit. Retrying after {$retryAfter} seconds");
            sleep(ceil($retryAfter) + 1);  // Add safety buffer
            $retryCount++;
            continue;
        }
        
        // =============================================================
        // ERROR LOGGING AND ANALYSIS
        // =============================================================
        $errorInfo = [
            'http_code' => $httpCode,
            'response' => $responseBody,
            'headers' => $responseHeaders,
            'file' => $filePath ? basename($filePath) : 'none'
        ];
        
        error_log("Discord API error: " . print_r($errorInfo, true));
        
        // =============================================================
        // FATAL ERROR HANDLING (4xx CLIENT ERRORS)
        // =============================================================
        // Don't retry on permanent client errors (except 429)
        if ($httpCode >= 400 && $httpCode < 500 && $httpCode !== 429) {
            return false;
        }
        
        $retryCount++;
    }
    
    // =================================================================
    // FINAL FAILURE AFTER RETRIES
    // =================================================================
    error_log("Failed after $maxRetries attempts");
    return false;
}

function validateTurnstile($token, $secret, $remoteip = null)
{
    $url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    $data = [
        'secret' => $secret,
        'response' => $token
    ];

    if ($remoteip) {
        $data['remoteip'] = $remoteip;
    }

    $options = [
        'http' => [
            'header' => "Content-type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($data)
        ]
    ];

    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);

    if ($response === FALSE) {
        return ['success' => false, 'error-codes' => ['internal-error']];
    }

    return json_decode($response, true);
}

?>
