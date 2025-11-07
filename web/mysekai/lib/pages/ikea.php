<!DOCTYPE html>
<html lang="ko">
    <head>
        <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/@sun-typeface/suit@2.0.5/fonts/variable/woff2/SUIT-Variable.css" crossorigin="anonymous">
        <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/bootswatch@5.3.3/dist/darkly/bootstrap.min.css" crossorigin="anonymous">
        <link rel="stylesheet" href="//fonts.googleapis.com/css?family=M+PLUS+1:400,600&display=swap" crossorigin="anonymous">
        <link rel="apple-touch-icon-precomposed" href="/static/icons/icon.png">
        <link rel="shortcut icon" href="/static/icon/icon.png">
        <link rel="apple-touch-icon" href="/static/icon/icon.png">
        <meta name="robots" content="noindex,nofollow">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <meta charset="utf-8">
        <title>マイセカイIKEA</title>
        <link rel="stylesheet" href="/static/mysekai/ikea.css">
    </head>
    <body>
    <div id="content">
        <div id="header">
            <div id="introduction"></div>
            <div class="form-check form-switch me-2">
                <input id="show-all-items" class="form-check-input" type="checkbox">
                <label class="form-check-label" for="optionHide" id="text-show-all"></label>
            </div>
            <input type="text" class="form-control mb-2 mt-2 d-inline-block rounded-0" id="search" autocomplete="on" placeholder="Search..." style="max-width: 400px;">
            <br>
            <small class="text-bg-secondary px-1 text-white inline-block" id="available-fixtures-status">
                <b id="text-fixture-count"></b> <span id="available-fixtures"></span>
            </small>&nbsp;
            <small class="text-bg-primary text-white px-1 inline-block">
                <b id="text-last-updated"></b> <span id="last-updated">...</span>
            </small>
        </div>
        <div id="result">
            <div class="spinner-border text-light ms-4" role="status"><span class="sr-only"></span></div>
        </div>
    </div>
    <script src="/static/mysekai/ikea.js?2025072512"></script>
    </body>
</html>
