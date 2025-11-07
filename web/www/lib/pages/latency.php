<?php if(!defined("SCOREBOARD")) die; ?>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="robots" content="noindex,nofollow">
    <meta name="google" content="notranslate">
    <meta name="theme-color" content="#000000">
    <meta name="referrer" content="no-referrer">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="manifest" href="/app.webmanifest" crossorigin="use-credentials">
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=M+PLUS+1&display=swap" crossorigin="anonymous">
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=M+PLUS+1+Code&display=swap" crossorigin="anonymous">
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Nanum+Gothic+Coding&display=swap" crossorigin="anonymous">
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Space+Mono&display=swap" crossorigin="anonymous">
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/@sun-typeface/suit@2.0.5/fonts/variable/woff2/SUIT-Variable.css" crossorigin="anonymous">
    <title>稼働テスト</title>
    <style>
        html, body {
            margin: 0;
            height: 100%;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'M PLUS 1', 'SUIT Variable', sans-serif;
            height: 100%;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        .container {
            max-width: 290px;
        }

        .main {
            background-color: white;
            padding: 20px 40px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        h1 {
            font-size: 2rem;
            color: #333;
            margin-bottom: 10px;
        }

        p {
            color: #666;
            font-size: 1rem;
            line-height: 1.6;
        }

        @media (max-width: 600px) {
            h1 {
                font-size: 1.6rem;
            }
            .icon {
                font-size: 50px;
            }
        }

        .ms {
            padding: 1px 3px;
        }

        .about {
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="main">
            <h2 id="textTitle">稼働テスト</h2>
            <table style="width: 100%; display: none;" id="resultTable">
                <tr>
                    <td align="center" id="textServerOverall">
                        ゲーム全体
                    </td>
                    <td style="padding-left: 10px;" align="right">
                        <span class="ms" id="speed-game-server">...</span>ms
                    </td>
                    <td align="right">
                        <small>±<span id="speed-game-server-jitter">...</span>ms</small>
                    </td>
                </tr>
                <tr>
                    <td align="center" id="textServerMultiLive">
                        マルチライブ
                    </td>
                    <td style="padding-left: 10px;" align="right">
                        <span class="ms" id="speed-multi">...</span>ms
                    </td>
                    <td align="right">
                        <small>±<span id="speed-multi-jitter">...</span>ms</small>
                    </td>
                </tr>
            </table><br>
            <span id="description">...</span><br>
        </div><br>
        <small class="about" id="textAbout">ここのいずれか一方が120msを超えると1時間あたりの🦐回数が30回未満になる可能性があります。</small><br>
    </div>
    <script>
        (async () => {
            const datasets = {};
            const options = JSON.parse(localStorage.getItem("options")) ?? {};

            const i18n = {
                ko: {
                    title: '가동테스트',
                    serverOverall: '게임 서버',
                    serverMultiLive: '멀티 서버',
                    testPrepare: '준비 중입니다',
                    testStart: '테스트 중입니다',
                    testDone: '테스트가 끝났습니다.',
                    about: '위 결과에서 한쪽이라도 120ms를 넘는 경우, 시간당 엔비 플레이수 이론치가 30미만이 될 수 있습니다.',
                },
                ja: {
                    title: '稼働テスト',
                    serverOverall: 'ゲーム全体',
                    serverMultiLive: 'マルチライブ',
                    testPrepare: 'テストを準備してます',
                    testStart: 'テスト中です',
                    testDone: 'テストが終わりました.',
                    about: 'ここのいずれか一方が120msを超えると1時間あたりの最大🦐回数(理論値)が30回未満になる可能性があります.',
                },
                en: {
                    title: 'Latency Test',
                    serverOverall: 'Game Server',
                    serverMultiLive: 'Multi Server',
                    testPrepare: 'Preparing Test',
                    testStart: 'Testing',
                    testDone: 'Test completed.',
                    about: 'There is a high chance that your ebi/h will go below 30 when you get 120ms or higher on either of ones.',
                },
            };
            const getDefaultLanguage = () => {
                let currentLanguage = navigator.language || navigator.userLanguage;
                switch (currentLanguage) {
                    case "ko":
                    case "ko-KP":
                    case "ko-KR":
                        return "ko";

                    case "ja":
                    case "ja-JP":
                        return "ja";

                    case "en-US":
                    default:
                        return "en";
                }
            };
            const currentLanguage = options.language ?? getDefaultLanguage();

            const setText = (id, value) => {
                const el = document.querySelector(id);
                if (el) el.innerText = value;
            };

            const pingServer = async (url, type, save_mode) => {
                let cache_buster = "?cache_buster=" + (+Date.now());

                performance.mark("test-start");
                let res = await fetch(
                        url + cache_buster, {
                            credentials: "omit",
                            referrerPolicy: "no-referrer",
                            priority: "high",
                            headers: {
                                "Pragma": "no-cache",
                                "Cache-Control": "no-cache"
                            },
                            mode: "no-cors",
                            cache: "no-store",
                            method: "GET",
                            signal: AbortSignal.timeout(3000)
                }).catch(r=>r);
                performance.mark("test-end");
                let perfResult = performance.measure("fullTest", "test-start", "test-end");

                let time = perfResult.duration;

                /*
                if(!save_mode){
                    return time;
                }

                if(!datasets[type] || datasets[type] >= time){
                    datasets[type] = time;
                    return time;
                }

                return datasets[type];
                */

                if (!save_mode) {
                    return {
                        result: time,
                        jitter: 0
                    };
                }

                if (!datasets[type]) {
                    datasets[type] = [time];
                    return {
                        result: time,
                        jitter: 0
                    };
                }
                datasets[type].push(time);
                let sum = datasets[type].reduce((partialSum, a) => partialSum + a, 0);
                return {
                    result: sum/datasets[type].length,
                    jitter: stddev(datasets[type])
                };
            };

            const getDomainAddresses = async (domain) => {
                let result = [];
                let url = `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`;
                let response = await fetch(
                    url, {
                        headers: {
                            "Accept": "application/dns-json",
                        },
                        cache: "no-store",
                        method: "GET",
                    })
                    .then(r=>r.json())
                    .catch(r=>{return {"error": r}});

                if (response.error) {
                	console.log(`getDomainAddress(${domain})`, response.error);
                    return [];
                }
                for(let entry of response.Answer){
                    if(entry.type == 1){
                    	result.push(entry.data);
                    }
                }
                return result;
            };

            const colorize = async (elem, data) => {
                let pingMinimum = data.result - data.jitter;

                if(pingMinimum >= 200){
                    elem.style.backgroundColor = "#E68777";
                }else if(pingMinimum >= 120){
                    elem.style.backgroundColor = "#E6DF53";
                }else if(pingMinimum >= 0){
                    elem.style.backgroundColor = "#CBE67E";
                }
            };

            const sleep = async (ms) => {
                return new Promise((r) => setTimeout(r, ms));
            };

            const stddev = (arr) => {
                const avg = arr.reduce((a, b) => a + b) / arr.length;
                const sq = arr.map(x => Math.pow(x - avg, 2));
                return Math.sqrt(sq.reduce((a, b) => a + b) / arr.length);
            };

            const init = async () => {
                const apiServer = "production-game-api.sekai.colorfulpalette.org";
                const multiServer = "https://asia-northeast1-5tkroniexa-an.a.run.app/api/ping";
                const apiServers = await getDomainAddresses(apiServer);


                // i18n
                const text = i18n[currentLanguage];
                setText("#textTitle", text.title);
                setText("#textServerOverall", text.serverOverall);
                setText("#textServerMultiLive", text.serverMultiLive);
                setText("#textAbout", text.about);

                // initial DNS warm-up pings
                setText("#description", text.testPrepare);
                for (let i = 0; i < 2; i++) {
                    await pingServer(multiServer, "multi", false);
                    for (let ip of apiServers) {
                        await pingServer(`https://${ip}/`, "api", false);
                    }
                    document.querySelector("#description").innerText += ".";
                    await sleep(500);
                }

                // the real test
                setText("#description", text.testStart);
                for (let i = 0; i < 10; i++) {
                    document.querySelector("#resultTable").style.display = "inline-table";

                    const multiPing = await pingServer(multiServer, "multi", true);
                    const apiPings = [];

                    for (let ip of apiServers) {
                        apiPings.push(await pingServer(`https://${ip}/`, "api", true));
                    }

                    const bestApiPing = apiPings.reduce((min, current) => current.result < min.result ? current : min);

                    setText("#speed-multi", multiPing.result.toFixed(0));
                    setText("#speed-multi-jitter", multiPing.jitter.toFixed(0));
                    colorize(document.querySelector("#speed-multi"), multiPing);

                    setText("#speed-game-server", bestApiPing.result.toFixed(0));
                    setText("#speed-game-server-jitter", bestApiPing.jitter.toFixed(0));
                    colorize(document.querySelector("#speed-game-server"), bestApiPing);

                    // jitter
                    if(i % 2 == 0){
                        document.querySelector("#description").innerText += ".";
                    }
                    await sleep(1000);
                }

                setText("#description", text.testDone);
            };

            init();
        })();
    </script>
</body>
</html>
