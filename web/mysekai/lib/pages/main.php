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
    <link rel="apple-touch-icon-precomposed" href="/static/icons/icon.png">
    <link rel="shortcut icon" href="/static/icon/icon.png">
    <link rel="apple-touch-icon" href="/static/icon/icon.png">
    <link rel="manifest" href="/app.webmanifest" crossorigin="use-credentials">
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=M+PLUS+1:400,600&display=swap" crossorigin="anonymous">
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/@sun-typeface/suit@2.0.5/fonts/variable/woff2/SUIT-Variable.css" crossorigin="anonymous">
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/bootswatch@5.3.3/dist/darkly/bootstrap.min.css" crossorigin="anonymous">
    <link rel="stylesheet" href="/static/main.css">
    <link rel="stylesheet" href="/static/mysekai/main.css">
    <title>/mysekai/</title>
</head>
<body>
  <div id="center">
    <div id="boxes">
      <a class="box" href="/ikea">
        <div class="box-background ikea"></div>
        <div class="box-background-cover"></div>
        <div class="box-label"></div>
        <div class="box-content" id="text-ikea">
          マイセカイ<br>IKEA
        </div>
      </a>
      <a class="box" href="//twy.name/PJSK/mysekai_gates.html" target="_blank">
        <div class="box-background gate"></div>
        <div class="box-background-cover"></div>
        <div class="box-label" id="text-external-site">外部サイト</div>
        <div class="box-content" id="text-gate">
          ゲートレベル<br>
          <span class="badge fw-normal text-bg-danger small">リーク可能性あり</span>
        </div>
      </a>
    </div>
  </div>
  <script>
    (async () => {
        let currentLanguage = navigator.language || navigator.userLanguage;
        switch(currentLanguage){
            case "ko":
            case "ko-KP":
            case "ko-KR":
                document.querySelectorAll("#text-external-site").forEach((e)=> { e.innerHTML = "외부 사이트"; });
                document.querySelector("#text-ikea").innerHTML = "마이세카이<br>IKEA";
                document.querySelector("#text-gate").innerHTML = `게이트 레벨<br><span class="badge fw-normal text-bg-danger small">유출 데이터 추정</span>`;
                document.title = "마이세카이";
                break;

            case "ja":
            case "ja-JP":
                document.title = "マイセカイ";
                break;

            case "en-US":
            default:
                document.title = "/mysekai/";
                document.querySelectorAll("#text-external-site").forEach((e)=> { e.innerHTML = "External Link"; });
                document.querySelector("#text-ikea").innerHTML = "Mysekai<br>IKEA";
                document.querySelector("#text-gate").innerHTML = `Gate Level<br><span class="badge fw-normal text-bg-danger small">Potential Leaks</span>`;
                break;
        }
    })();
  </script>
</body>
</html>
