<?php

if(!defined("SCOREBOARD")) die;
http_response_code(200);

?>
<!DOCTYPE html>
<html class="notranslate" translate="no">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="google" content="notranslate">
    <meta name="robots" content="noindex,nofollow">
    <meta name="theme-color" content="#000000">
    <meta name="referrer" content="no-referrer">
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <link rel="shortcut icon" href="/static/icon/icon.png">
    <link rel="apple-touch-icon-precomposed" href="/static/icon/icon.png">
    <link rel="apple-touch-icon" href="/static/icons/icon.png">
    <link rel="manifest" href="/app.webmanifest" crossorigin="use-credentials">
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=M+PLUS+1&display=swap" crossorigin="anonymous">
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/@sun-typeface/suit@2.0.5/fonts/variable/woff2/SUIT-Variable.css" crossorigin="anonymous">
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/bootswatch@5.3.7/dist/darkly/bootstrap.min.css" crossorigin="anonymous">
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.css" crossorigin="anonymous">
    <link rel="stylesheet" href="/static/login.css?20250925" crossorigin="anonymous">
    <title>sekai.run</title>
    <style>.cf-turnstile { height: 65px; } </style>
</head>
<body>
    <div id="statistics" class="statistics mono d-none"></div>
    <div class="glass-card pb-2">
        <div id="serviceEnd" class="alert alert-danger py-2 px-2 small rounded-0 d-block" role="alert">
            sekai.runは2025年12月1日をもちましてサービスを終了いたします
        </div>
        <form id="loginForm" class="d-block" onsubmit="login(); return false;">
            <div id="loginError" class="challenge-error-text alert alert-danger py-2 px-3 small rounded-0 d-none" role="alert">
            </div>
            <div class="form-floating mb-3">
                <input type="username" class="rounded-0 form-control" id="floatingLoginUsername" placeholder="Username" minlength="4" maxlength="64">
                <label class="rounded-0 bg-transparent" for="floatingLoginUsername"></label>
            </div>
            <div class="form-floating mb-3">
                <input type="password" class="rounded-0 form-control pe-5" id="floatingLoginPassword" placeholder="Password" minlength="6">
                <label for="floatingLoginPassword"></label>
                <button type="button" class="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y p-0 toggle-password" id="toggleLoginPassword">
                    <i class="bi bi-eye"></i>
                </button>
            </div>
            <div class="form-floating mb-3">
                <div id="cfLogin" class="cf-turnstile"
                    data-sitekey="0x4AAAAAABsKb_RqDCLGygJL"
                    data-theme="dark"
                    data-size="flexible"
                    data-action="login"
                    data-callback="onTurnstileLogin"
                    data-expired-callback="onTurnstileLoginExpired"></div>
            </div>
            <div class="d-grid mb-3">
                <button type="submit" class="btn btn-custom btn-lg rounded-0" id="btnLogin" disabled></button>
            </div>
            <!--
            <p class="text-center small"><span id="msgSignUp"></span> <a href="#" onclick="toggleSignUp()" id="linkRegister"></a></p>
            -->
        </form>
        <form id="signupForm" class="d-none" onsubmit="register(); return false;">
            <div id="signUpError" class="challenge-error-text alert alert-danger py-2 px-3 small rounded-0 d-none" role="alert">
            </div>
            <div class="form-floating mb-3">
                <input type="username" class="rounded-0 form-control" id="floatingRegisterUsername" placeholder="Username" minlength="4" maxlength="64">
                <label class="rounded-0 bg-transparent" for="floatingRegisterUsername"></label>
            </div>
            <div class="form-floating mb-3">
                <input type="password" class="rounded-0 form-control pe-5" id="floatingRegisterPassword" placeholder="Password" minlength="6">
                <label for="floatingRegisterPassword"></label>
                <button type="button" class="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y p-0 toggle-password" id="toggleSignUpPassword">
                    <i class="bi bi-eye"></i>
                </button>
            </div>
            <div class="form-floating mb-3">
                <input type="inviteCode" class="rounded-0 form-control" id="floatingInviteCode" placeholder="InviteCode">
                <label for="floatingInviteCode"></label>
            </div>
            <div class="form-floating mb-3">
                <input type="text" class="rounded-0 form-control" id="floatingFriendCode" placeholder="Friend ID" inputmode="numeric" pattern="[0-9]*">
                <label for="floatingFriendCode"></label>
            </div>
            <div class="form-floating mb-3" id="registerTurnstile" style="display: none;">
                <div id="cfRegister" class="cf-turnstile"
                    data-sitekey="0x4AAAAAABsKb_RqDCLGygJL"
                    data-theme="dark"
                    data-size="flexible"
                    data-action="register"
                    data-callback="onTurnstileRegister"
                    data-expired-callback="onTurnstileRegisterExpired"></div>
            </div>
            <div class="d-grid mb-3">
                <button type="submit" class="btn btn-custom btn-lg rounded-0" id="btnRegister" disabled></button>
            </div>
            <p class="text-center small"><span id="msgSignIn"></span> <a href="#" onclick="toggleSignUp()" id="linkLogin"></a></p>
        </form>
    </div>
    <div id="disclaimer" class="disclaimer mono"></div>
    <script referrerpolicy="no-referrer" src="//cdn.jsdelivr.net/npm/jquery@4.0.0-beta.2/dist/jquery.min.js" crossorigin="anonymous"></script>
    <script referrerpolicy="no-referrer" src="//cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
    <script referrerpolicy="no-referrer" src="//cdn.jsdelivr.net/npm/js-sha512@0.9.0/build/sha512.min.js" crossorigin="anonymous"></script>
    <script src="/static/login.js?20250925"></script>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</body>
</html>
