
// Normalize and lowercase (Japanese)
const normalizeText = (str) => {
    return str
        .normalize("NFKC")
        .replace(/[\u30a1-\u30f6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
        .toLowerCase();
}

// For converting CJK monospace font alignments
const toFullWidth = (str) => {
    return str.replace(/[\ 0-9a-zA-Z]/g, c =>
        c === " " ? "\u3000" : String.fromCharCode(c.charCodeAt(0) + 0xFEE0)
    );
};

// prevent XSS
const htmlEscape = (str) => {
    const escapeChars = (c) => `&#${c.charCodeAt(0)};`;
    return str.includes("<") || str.includes(">") ? String(str).replace(/[^\w. ]/gi, escapeChars) : str;
};

const htmlUnescape = (str) => {
    const doc = new DOMParser().parseFromString(str, "text/html");
    return doc.documentElement.textContent;
};

// both do a decryption against the API server's response
const serviceEscapeLite = (buf) => {
    if (buf[0].constructor.name !== "Uint8Array" || buf[1].constructor.name !== "ArrayBuffer"){
        return {};
    }

    let xec = (text, key) => {
        key = new TextEncoder().encode(key);
        text = new TextEncoder().encode(text);
        let res = new Uint8Array(text.byteLength);
        for(let i=0; i<text.byteLength; i++){
            res[i] = (text[i] ^ key[i % key.byteLength]) & 0xff;
        }
        return res;
    };
    let data = new TextDecoder().decode(buf[1]);
    if(!challengePassasgeCheck(data)) return JSON.parse("{}");
    data = new TextDecoder().decode(xec(data, "\x0f"));
    data = JSON.parse(data);
    return data;
};

const serviceEscapeHeavy = (buf) => {
    // This is the simple XOR encryption made out of serviceEscapeLite
    let xec = (text, key) => {
        key = new TextEncoder().encode(key);
        text = new TextEncoder().encode(text);
        let res = new Uint8Array(text.byteLength);
        for(let i=0; i<text.byteLength; i++){
            res[i] = (text[i] ^ key[i % key.byteLength]) & 0xff;
        }
        return res;
    };
    return new TextDecoder().decode(xec(buf, "\x0f"));
};


const serviceEscape = (buf) => {
    try {
        if (buf[0].constructor.name !== "Uint8Array" || buf[1].constructor.name !== "ArrayBuffer"){
            return {};
        }

        let xec = (text, key) => {
            key = new TextEncoder().encode(key);
            text = new Uint8Array(text);
            let res = new Uint8Array(text.byteLength);
            for(let i=0; i<text.byteLength; i++){
                res[i] = (text[i] ^ key[i % key.byteLength]) & 0xff;
            }
            return res;
        };
        let xed = (text, key) => {
            // decryption :)
            text = text.constructor.name[6]; // o
            key = key.constructor.name.toLowerCase()[0]; // a
            // text: azusawa kohane
            text = [
                key + "z" + "us" + key + "w" + key + " k" + text + "h" + key + "ne " + 1339 + "" + 1339,
                "i"
            ];
            // airi
            key = text[0][0] + text[1] + buf.constructor.name[1] + text[1];
            return [
                text[0].split("").reverse().join(""),
                ("00" + 114514 + " " + key[0] + "k" + "ur" + text[0][0] + "h" + (key + " ").split("").reverse().join("").repeat(2) + " el" + key[1] + "ms e" + key[1] + "tuc").split("").reverse().join("")
            ];
        };

        // RC4
        let xeq = (key, str) => {
            str = new Uint8Array(str);
            let s = [];
            let j = 0;
            let x;
            let res = [];
            for (let i = 0; i < 256; i++) {
                s[i] = i;
            }
            for (let i = 0; i < 256; i++) {
                j = (j + s[i] + key[i % key.length]) % 256;
                x = s[i];
                s[i] = s[j];
                s[j] = x;
            }
            let i = 0;
            j = 0;
            for (let  y = 0; y < str.length; y++) {
                i = (i + 1) % 256;
                j = (j + s[i]) % 256;
                x = s[i];
                s[i] = s[j];
                s[j] = x;
                res.push(str[y] ^ s[(s[i] + s[j]) % 256]);
            }
            return Uint8Array.from(res);
        };

        let xee = (text, key) => {
            return xeq(new TextEncoder().encode((new TextDecoder().decode(key)).split('"')[1]), text);
        };

        let data = new TextDecoder().decode(xec(xec(fflate.inflateSync(xec(xee(buf[1], buf[0]), xed(TextEncoder, buf[1])[0])), xed(TextEncoder, buf[1])[1])));
        return JSON.parse(data);
    }catch(e){
        return JSON.parse("{}");
    }
};

// show image URL with list of fallback candidates
const getCardImageUrl = (assetId, assetType) => {
    const imageType = assetType === "special_training" ? "after_training" : "normal";
    const baseUrlSekaiRun = "/assets/";
    const baseUrlSekaiBest = "https://storage.sekai.best/sekai-jp-assets/thumbnail/chara_rip/";
    const fallbackUrl = "/static/sorry.png";

    return [
        baseUrlSekaiRun + assetId + "/" + imageType,
        baseUrlSekaiBest + assetId + "_" + imageType + ".webp",
        fallbackUrl
    ];
};

// get localized numbers (1st, 2nd, ...)
const getLocalizedOrdinal = (num) => {
    switch(options.language){
        // 1st, 2nd, 3rd, ...
        case "en":
            const getOrdinal = (n) => {
                let s = ["th", "st", "nd", "rd"],
                    v = n % 100;
                return n = (s[(v - 20) % 10] || s[v] || s[0]);
            }
            return num + getOrdinal(num);

        // ordinal not numbered
        default:
            return num + i18n[options.language].textBorderRank;
    }
};

// render recent Logs

const getRoundedTime = (currentTime, seconds=60) => {
    const coeff = 1000 * seconds;
    const now = new Date(currentTime);
    return Math.round(Math.floor(now / coeff) * coeff / 1000) * 1000;
};

const getProfileHistory = (playerInfo) => {
    let playerHistory = playerInfo['profile_history'];
    let playerHistoryCompare = playerInfo['profile_history_compare'];
    let playerHistoryResult = '';

    playerHistory?.forEach(prevInfo => {
        playerHistoryResult += `
            <tr>
                <td class="text-center align-middle">
                    ${prevInfo.event_name}
                </td>
                <td class="text-center align-middle">${prevInfo.rank}</td>
                <td class="text-center align-middle">
                    ${prevInfo.nickname}
                    ${profileInfo.compare_info ? `<small>(${i18n[options.language].textPlayer})</small>` : ``}
                </td>
                <td class="text-center align-middle">${Number(prevInfo.score).toLocaleString()} pt</td>
            </tr>
        `;
    });
    playerHistoryCompare?.forEach(prevInfo => {
        playerHistoryResult += `
            <tr>
                <td class="text-center align-middle">
                    ${prevInfo.event_name}<br>
                </td>
                <td class="text-center align-middle">${prevInfo.rank}</td>
                <td class="text-center align-middle">
                    ${prevInfo.nickname}
                    ${profileInfo.compare_info ? `<small>(${i18n[options.language].textCompare})</small>` : ``}
                </td>
                <td class="text-center align-middle">${Number(prevInfo.score).toLocaleString()} pt</td>
            </tr>
        `;
    });

    if (!playerHistoryResult) {
        playerHistoryResult = `
            <tr>
                <td class="text-center align-middle" colspan=4>
                    ${i18n[options.language].textHistoryNotFound}
                </td>
            </tr>
        `;
    }

    $("#userHistory").html(playerHistoryResult);
};

const renderProfileLog = (linePlayer, lineCompare) => {
    const logTable = document.querySelector("#table-profile-last-hour table");
    const logTableScroll = document.querySelector("#table-profile-last-hour .table-scroll");
    const statusText = document.querySelector("#textPlayerLastHourStatus");
    const hasCompare = !!lineCompare[0].length;
    const now = +new Date();
    const roundedNow = getRoundedTime(now, 60);

    logTableScroll.style.height = hasCompare ? "348px" : "248px";
    const styleColumn = hasCompare ? "min-width: 150px" : "width: max-content";

    let textResult = `
        <thead>
            <tr>
                <th class="bg-black" style="width: revert-layer"></th>
                <th class="bg-black text-center align-middle text-white" id="textPlayerLogSelf" style="${styleColumn}">...</th>
                <th class="${hasCompare ? "" : "d-none"} bg-black text-center align-middle text-white" id="textPlayerLogCompare" style="${styleColumn}">...</th>
            </tr>
        </thead>
    `;

    const buildDataset = (timestamps, values) => {
        const data = {};
        let max = 0;
        const lastIndex = timestamps.length - 1;
        for (let i = lastIndex; i > lastIndex - 60; i--) {
            const time = getRoundedTime(timestamps[i], 60);
            const prevTime = getRoundedTime(timestamps[i - 1], 60);
            const diff = (values[i] || 0) - (values[i - 1] || 0);
            const actualDiff = (time - prevTime) / 1000;
            if (actualDiff >= 600 || isNaN(actualDiff)) continue;
            data[time] = diff;
            max = Math.max(max, diff);
        }
        return { data, max };
    };

    const playerData = buildDataset(linePlayer[0], linePlayer[1]);
    const compareData = hasCompare ? buildDataset(lineCompare[0], lineCompare[1]) : { data: {}, max: 0 };

    const summary = {
        player: { count: 0, total: 0 },
        compare: { count: 0, total: 0 }
    };

    let hourCount = 0;
    for (let i = 0; hourCount < 60 && i <= 90; i++) {
        const time = roundedNow - (i * 60000);
        const pDiff = playerData.data[time];
        const cDiff = compareData.data[time];
        if (pDiff === undefined || (hasCompare && cDiff === undefined)) continue;

        const formatDiff = (diff, max) => {
            diff = Number(~~diff);
            if (diff === 0) return ["", "0"];
            if (diff < max * 0.2) return ["bg-danger", diff.toLocaleString()];
            if (diff < max * 0.7) return ["bg-warning", diff.toLocaleString()];
            return ["bg-success", diff.toLocaleString()];
        };

        const [pClass, pValue] = formatDiff(pDiff, playerData.max);
        const [cClass, cValue] = formatDiff(cDiff, compareData.max);

        if (pDiff > 0) {
            summary.player.count++;
            summary.player.total += pDiff;
        }
        if (cDiff > 0) {
            summary.compare.count++;
            summary.compare.total += cDiff;
        }

        textResult += `
            <tr>
                <td class="text-center bg-black">${dateFmt(new Date(time))}</td>
                <td class="text-center ${pClass}">${pValue}</td>
                <td class="text-center ${cClass} ${hasCompare ? "" : "d-none"}">${cValue}</td>
            </tr>
        `;

        hourCount++;
    }

    // status check
    let statusTextData = '';
    if (hourCount) {
        statusTextData = `
            <ul class="mb-0 ps-3">
                <li><small>
                    <b><u>${i18n[options.language].textPlayer}</u></b>: ${summary.player.count}${i18n[options.language].textPlayCount} /
                    ${i18n[options.language].textPlayMaximum} ${playerData.max.toLocaleString()} pt /
                    ${i18n[options.language].textPlayHourly} ${summary.player.total.toLocaleString()} pt
                </small></li>
        `;

        if (hasCompare) {
            statusTextData += `
                <li><small>
                    <b><u>${i18n[options.language].textCompare}</u></b>: ${summary.compare.count}${i18n[options.language].textPlayCount} /
                    ${i18n[options.language].textPlayMaximum} ${compareData.max.toLocaleString()} pt /
                    ${i18n[options.language].textPlayHourly} ${summary.compare.total.toLocaleString()} pt
                </small></li>
            `;
        }
        statusTextData += `</ul>`;
    } else {
        if (hasCompare) {
            textResult += `
                <tr>
                    <td colspan="3" class="text-center bg-black" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000 !important;"><br><br><br><br><br><br>N/A</td>
                </tr>
            `;
        }else{
            textResult += `
                <tr>
                    <td colspan="3" class="text-center bg-black" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000 !important;"><br><br><br><br>N/A</td>
                </tr>
            `;
        }
        statusTextData = `
            &nbsp;
        `;
    }

    logTable.innerHTML = textResult;
    logTableScroll.scrollTop = 0;
    statusText.innerHTML = statusTextData;

    $("#textPlayerLogSelf").html(`${profileInfo.profile_nickname}<br><small>(${i18n[options.language].textPlayer})</small>`);
    if (hasCompare) {
        $("#textPlayerLogCompare").html(`${profileInfo.compare_info.profile_nickname}<br><small>(${i18n[options.language].textCompare})</small>`);
    }
};

// show profile chart
const renderProfileChart = (linePlayer, lineBorder, lineCompare, lineDescription, lineType, rankId, targetCharacterId) => {
    let ctx = document.getElementById("chart");
    if (profileChart) {
        profileChart.destroy();
    }

    let predictionType = "jiiku";
    const chartOptions = getChartOptions();
    const addDataset = (label, data, borderColor, backgroundColor) => {
        chartOptions.data.datasets.push({
            label,
            lineTension: 0,
            data,
            borderWidth: 2,
            pointRadius: 1,
            radius: 0,
            borderColor,
            backgroundColor
        });
    };

    // filter prediction based on rank
    const filterPredictionData = (data, rank) => {
        return data[rank]?.map(val => ({ x: val[0] * 1000, y: val[1] }));
    };

    // fetch player/border dataset
    let linePlayerDataset = linePlayer[0].map((data, idx) => ({ x: data, y: linePlayer[1][idx] }));
    let lineBorderDataset = lineBorder[0].map((data, idx) => ({ x: data, y: lineBorder[1][idx] }));
    let lineCompareDataset = lineCompare[0].map((data, idx) => ({ x: data, y: lineCompare[1][idx] }));

    if (options.playerGraph && linePlayerDataset.length > 0) addDataset(lineDescription[0], linePlayerDataset, '#36A2EB', '#9BD0F5');
    if (options.borderGraph && lineBorderDataset.length > 0) addDataset(lineDescription[1], lineBorderDataset, '#FF6384', '#FFB1C1');
    if (lineCompareDataset.length > 0) addDataset(lineDescription[3], lineCompareDataset, '#FFFFFF', '#FFFFFF');

    // fetch prediction dataset
    if (options.predictionGraph &&
        linePlayerDataset.length > 0 &&
        typeof predictionData === "object" &&
        Object.keys(predictionData[predictionType] ?? {}).length !== 0) {

        if (predictionData[predictionType].eventId == eventInfo.eventId) {
            const predictionBorderList = [1, 2, 3, 10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7000, 10000];
            let borderTarget = [7000, 10000];
            for (const [borderIdx, borderRank] of predictionBorderList.entries()) {
                if (borderIdx === 0 || rankId > borderRank) continue;
                borderTarget = [predictionBorderList[borderIdx - 1], borderRank];
                break;
            }

            let linePredictionDatasetHigh = [];
            let linePredictionDatasetLow = [];

            if (targetCharacterId === "all") {
                // on WL, there are not enough datasets for predictions. so we skip fetching those.
                if (!Object.keys(predictionData[predictionType].wl ?? {}).length) {
                    linePredictionDatasetHigh = filterPredictionData(predictionData[predictionType].all ?? {}, borderTarget[0]);
                    linePredictionDatasetLow = filterPredictionData(predictionData[predictionType].all ?? {}, borderTarget[1]);
                }
            }else{
                if (Object.keys(predictionData[predictionType].wl ?? {}).length) {
                    linePredictionDatasetHigh = filterPredictionData(predictionData[predictionType].wl[targetCharacterId] ?? {}, borderTarget[0]);
                    linePredictionDatasetLow = filterPredictionData(predictionData[predictionType].wl[targetCharacterId] ?? {}, borderTarget[1]);
                }
            }

            if (linePredictionDatasetHigh?.length) addDataset(getLocalizedOrdinal(borderTarget[0]) + lineDescription[2], linePredictionDatasetHigh, '#FFD700', '#FFB130');
            if (linePredictionDatasetLow?.length) addDataset(getLocalizedOrdinal(borderTarget[1]) + lineDescription[2], linePredictionDatasetLow, '#FF3700', '#FF3130');
        }
    }

    // stop chart if no data
    if (chartOptions.data.datasets.length < 1) {
        $("#chartNotFound").show();
        $(".chartWrapper").hide();
        return;
    }

    // change types to hours if WL
    if (lineType !== "all") chartOptions.options.scales.x.time.unit = "hour";

    chartOptions.options.scales.x.adapters.date.locale = options.language ?? "en";

    // set zoom limits
    if (eventInfo?.eventStartAt && eventInfo?.eventEndAt) {
        chartOptions.options.plugins.zoom.limits = {
            x: {
                  min: eventInfo.eventStartAt,
                  max: eventInfo.eventEndAt,
            },
        }
    }

    profileChart = new Chart(ctx, chartOptions);
};

const viewProfileChart = (targetCharacterId, rankId) => {
    let chartItems = "";
    if (!profileInfo) return;
    if (!targetCharacterId) targetCharacterId = sessionStorage.getItem("profileCharacterId");
    if (!rankId) rankId = sessionStorage.getItem("profileRankId");

    // comparison data puts background color. reset those backgrounds upon any changes in profileChartView
    const removeClassByPrefix = (el, prefix) => {
        let regex = new RegExp('\\b' + prefix + '.*?\\b', 'g');
        el.className = el.className.replace(regex, '');
        return el;
    };
    const elementList = [
        "#speedCompareDay",
        "#speedPlayerDay",
        "#speedCompareHour",
        "#speedPlayerHour",
        "#speedCompareTotal",
        "#speedPlayerTotal",
    ];
    elementList.forEach(elementName => {
        removeClassByPrefix(document.querySelector(elementName), "bg-");
        removeClassByPrefix(document.querySelector(elementName).previousElementSibling, "bg-");
    });

    let wlChapterEventInfo = {};
    if(targetCharacterId !== "all"){
        wlChapterEventInfo = bloomInfo[eventInfo.eventId][targetCharacterId];
    }

    sessionStorage.setItem("profileRankId", rankId);
    sessionStorage.setItem("profileCharacterId", targetCharacterId);

    // check if the border rank is only for WL chapters
    if(([7000, 70000].includes(rankId))){
        // ... if so, don't read this chapter
        if(targetCharacterId == "all"){
            for (let characterId of Object.keys(profileInfo.profile_graph.wl)) {
                viewProfileChart(characterId, rankId);
                return;
            }
        }
    }else{
        if(profileInfo.profile_graph.all.x.length > 0){
            chartItems += `
                <li class="nav-item profile-nav-item">
                    <a role="button" class="nav-link ${targetCharacterId == "all" && "active"}" data-character-id="all" data-profile-rank="${rankId}">${i18n[options.language].panelTotal}</a>
                </li>`;
        }
    }

    for (let characterId of Object.keys(profileInfo.profile_graph.wl)) {
        let characterName = getCharacterNameById(characterId);
        if(profileInfo.profile_graph.wl[characterId].x.length > 0){
            chartItems += `
                <li class="nav-item profile-nav-item">
                    <a class="nav-link ${targetCharacterId == characterId && "active"}" role="button" data-character-id="${characterId}" data-profile-rank="${rankId}">${characterName}</a>
                </li>`;
        }
    }
    $("#chartType").html(chartItems);
    if(options.predictionGraph == true){
        $("#textPredictionWarning").show();
    }else{
        $("#textPredictionWarning").hide();
    }

    // rendering
    let linePlayer = [[], []];
    let lineBorder = [[], []];
    let lineCompare = [[], []];
    try {
        let lineType = "";
        let compareNickname = "";
        if(profileInfo.compare_info){
            compareNickname = profileInfo.compare_info.profile_nickname;
        }

        let lineDescription = [
            profileInfo.profile_nickname,
            getLocalizedOrdinal(rankId) + ' ' + i18n[options.language].textBorder, // localize ordinal numbering for English
            ' ' + i18n[options.language].textPrediction, // rankId is filled later
            compareNickname
        ];

        if (targetCharacterId == "all") {
            if(profileInfo.profile_graph.all.x.length == 0 && profileInfo.border_graph.all.x.length == 0){
                $("#chartNotFound").show();
                $(".chartWrapper").hide();
                return;
            }

            linePlayer = [profileInfo.profile_graph.all.x, profileInfo.profile_graph.all.y];
            lineBorder = [profileInfo.border_graph.all.x, profileInfo.border_graph.all.y];
            lineCompare = [profileInfo.compare_graph.all.x, profileInfo.compare_graph.all.y];
            lineType = "all";
        } else {
            if(profileInfo.profile_graph.wl[targetCharacterId].x.length == 0 && profileInfo.border_graph.wl[targetCharacterId].x.length == 0){
                $("#chartNotFound").show();
                $(".chartWrapper").hide();
                return;
            }

            // skip if chapter has been ended
            for (let i = 0; i < profileInfo.border_graph.wl[targetCharacterId].x.length; i++) {
                let lineDate = profileInfo.border_graph.wl[targetCharacterId].x[i] / 1000;
                if(lineDate >= wlChapterEventInfo.chapter_end + 600 || lineDate <= wlChapterEventInfo.chapter_start - 600) continue;

                if(profileInfo.profile_graph.wl[targetCharacterId].x[i]){
                    linePlayer[0].push(profileInfo.profile_graph.wl[targetCharacterId].x[i]);
                    linePlayer[1].push(profileInfo.profile_graph.wl[targetCharacterId].y[i]);
                }

                if (profileInfo.border_graph.wl[targetCharacterId] &&
                    profileInfo.border_graph.wl[targetCharacterId].x[i]) {

                    lineBorder[0].push(profileInfo.border_graph.wl[targetCharacterId].x[i]);
                    lineBorder[1].push(profileInfo.border_graph.wl[targetCharacterId].y[i]);
                }
                if (profileInfo.compare_graph.wl[targetCharacterId] &&
                    profileInfo.compare_graph.wl[targetCharacterId].x[i]) {
                    lineCompare[0].push(profileInfo.compare_graph.wl[targetCharacterId].x[i]);
                    lineCompare[1].push(profileInfo.compare_graph.wl[targetCharacterId].y[i]);
                }
            }
            lineType = "world_link";
        }
        renderProfileLog(
            linePlayer,
            lineCompare
        );
        analyzeGraphs([{x: linePlayer[0], y: linePlayer[1]}, {x: lineCompare[0], y: lineCompare[1]}],
              [profileInfo.profile_nickname, compareNickname],
              profileInfo.compare_info ? true : false);
        $("#chartNotFound").hide();
        $(".chartWrapper").show();

        $("#chartSelect").html(`<img src="data:image/svg+xml;base64,${generateSvg(currentUserInfo.uid)}" width="1" height="1">`);

        renderProfileChart(
            linePlayer,
            lineBorder,
            lineCompare,
            lineDescription,
            lineType,
            rankId,
            targetCharacterId
        );

    } catch(e) {
        console.log(e);
        $("#chartNotFound").show();
        $(".chartWrapper").hide();
    }

    try{
        // player calculations
        let speedPlayerTotal = 0;
        let speedPlayerDay = 0;
        let speedPlayerHour = 0;
        let currentPlayerIndex = linePlayer[0].length - 1;
        let lastPlayerHourIndex = linePlayer[0].length - 1 - 60;
        let lastPlayerDayIndex = linePlayer[0].length - 1 - (60*24);
        let speedPlayerTotalHourDiff = (linePlayer[0][currentPlayerIndex] - linePlayer[0][0]) / 3600000;
        let speedPlayerDayHourDiff = (linePlayer[0][currentPlayerIndex] - linePlayer[0][lastPlayerDayIndex]) / 3600000;
        let speedPlayerHourHourDiff = (linePlayer[0][currentPlayerIndex] - linePlayer[0][lastPlayerHourIndex]) / 3600000;
        speedPlayerTotal = (linePlayer[1][currentPlayerIndex] - linePlayer[1][0]) / speedPlayerTotalHourDiff;
        speedPlayerDay = (linePlayer[1][currentPlayerIndex] - linePlayer[1][lastPlayerDayIndex]) / speedPlayerDayHourDiff;
        speedPlayerHour = (linePlayer[1][currentPlayerIndex] - linePlayer[1][lastPlayerHourIndex]) / speedPlayerHourHourDiff;

        // border calculations
        let speedBorderTotal = 0;
        let speedBorderDay = 0;
        let speedBorderHour = 0;
        let currentBorderIndex = lineBorder[0].length - 1;
        let lastBorderHourIndex = lineBorder[0].length - 1 - 60;
        let lastBorderDayIndex = lineBorder[0].length - 1 - (60*24);
        let speedBorderTotalHourDiff = (lineBorder[0][currentBorderIndex] - lineBorder[0][0]) / 3600000;
        let speedBorderDayHourDiff = (lineBorder[0][currentBorderIndex] - lineBorder[0][lastBorderDayIndex]) / 3600000;
        let speedBorderHourHourDiff = (lineBorder[0][currentBorderIndex] - lineBorder[0][lastBorderHourIndex]) / 3600000;
        speedBorderTotal = (lineBorder[1][currentBorderIndex] - lineBorder[1][0]) / speedBorderTotalHourDiff;
        speedBorderDay = (lineBorder[1][currentBorderIndex] - lineBorder[1][lastBorderDayIndex]) / speedBorderDayHourDiff;
        speedBorderHour = (lineBorder[1][currentBorderIndex] - lineBorder[1][lastBorderHourIndex]) / speedBorderHourHourDiff;

        // comparison calculations
        let speedCompareTotal = 0;
        let speedCompareDay = 0;
        let speedCompareHour = 0;

        if(lineCompare[0].length){
            let currentCompareIndex = lineCompare[0].length - 1;
            let lastCompareHourIndex = lineCompare[0].length - 1 - 60;
            let lastCompareDayIndex = lineCompare[0].length - 1 - (60*24);
            let speedCompareTotalHourDiff = (lineCompare[0][currentCompareIndex] - lineCompare[0][0]) / 3600000;
            let speedCompareDayHourDiff = (lineCompare[0][currentCompareIndex] - lineCompare[0][lastCompareDayIndex]) / 3600000;
            let speedCompareHourHourDiff = (lineCompare[0][currentCompareIndex] - lineCompare[0][lastCompareHourIndex]) / 3600000;
            speedCompareTotal = (lineCompare[1][currentCompareIndex] - lineCompare[1][0]) / speedCompareTotalHourDiff;
            speedCompareDay = (lineCompare[1][currentCompareIndex] - lineCompare[1][lastCompareDayIndex]) / speedCompareDayHourDiff;
            speedCompareHour = (lineCompare[1][currentCompareIndex] - lineCompare[1][lastCompareHourIndex]) / speedCompareHourHourDiff;
            $(".textPlayer").html(`${profileInfo.profile_nickname} <small>(${i18n[options.language].textPlayer})</small>`);
            $(".textCompare").html(`${profileInfo.compare_info.profile_nickname} <small>(${i18n[options.language].textCompare})</small>`);
            $(".textCompare").show();
            $(".textCompareResult").show();
        }else{
            $(".textPlayer").html(i18n[options.language].textPlayer);
            $(".textCompare").hide();
            $(".textCompareResult").hide();
        }

        let speedRate = "/hr";
        $(".hourlyInfoDisplay").show();
        if(options.daySpeed){
            speedPlayerTotal = speedPlayerTotal * 24;
            speedPlayerHour = speedPlayerHour * 24;
            speedPlayerDay = speedPlayerDay * 24;
            speedBorderTotal = speedBorderTotal * 24;
            speedBorderHour = speedBorderHour * 24;
            speedBorderDay = speedBorderDay * 24;
            speedCompareTotal = speedCompareTotal * 24;
            speedCompareHour = speedCompareHour * 24;
            speedCompareDay = speedCompareDay * 24;

            $(".hourlyInfoDisplay").hide();
            speedRate = "/day";
        }

        // display
        if(isNaN(speedPlayerDay) || speedPlayerDay <= 0 || linePlayer[0].length < 12*24){
            $("#speedPlayerDay").html("N/A");
        }else{
            $("#speedPlayerDay").html(Number(~~speedPlayerDay).toLocaleString() + " pt" + speedRate);
        }
        if(isNaN(speedPlayerHour) || speedPlayerHour <= 0 || linePlayer[0].length < 12){
            $("#speedPlayerHour").html("N/A");
        }else{
            $("#speedPlayerHour").html(Number(~~speedPlayerHour).toLocaleString() + " pt" + speedRate);
        }
        if(isNaN(speedPlayerTotal) || !isFinite(speedPlayerTotal) || speedPlayerTotal <= 0){
            $("#speedPlayerTotal").html("N/A");
        }else{
            $("#speedPlayerTotal").html(Number(~~speedPlayerTotal).toLocaleString() + " pt" + speedRate);
        }

        if(isNaN(speedBorderDay) || speedBorderDay <= 0 || lineBorder[0].length < 12*24){
            $("#speedBorderDay").html("N/A");
        }else{
            $("#speedBorderDay").html(Number(~~speedBorderDay).toLocaleString() + " pt" + speedRate);
        }
        if(isNaN(speedBorderHour) || speedBorderHour <= 0 || lineBorder[0].length < 12){
            $("#speedBorderHour").html("N/A");
        }else{
            $("#speedBorderHour").html(Number(~~speedBorderHour).toLocaleString() + " pt" + speedRate);
        }
        if(isNaN(speedBorderTotal) || speedBorderTotal <= 0){
            $("#speedBorderTotal").html("N/A");
        }else{
            $("#speedBorderTotal").html(Number(~~speedBorderTotal).toLocaleString() + " pt" + speedRate);
        }

        // Add comparison data if exists
        if(lineCompare[0].length){
            if(isNaN(speedCompareDay) || speedCompareDay <= 0 || lineCompare[0].length < 12*24){
                $("#speedCompareDay").html("N/A");
            }else{
                $("#speedCompareDay").html(Number(~~speedCompareDay).toLocaleString() + " pt" + speedRate);
            }
            if(isNaN(speedCompareHour) || speedCompareHour <= 0 || lineCompare[0].length < 12){
                $("#speedCompareHour").html("N/A");
            }else{
                $("#speedCompareHour").html(Number(~~speedCompareHour).toLocaleString() + " pt" + speedRate);
            }
            if(isNaN(speedCompareTotal) || speedCompareTotal <= 0){
                $("#speedCompareTotal").html("N/A");
            }else{
                $("#speedCompareTotal").html(Number(~~speedCompareTotal).toLocaleString() + " pt" + speedRate);
            }

            if(speedCompareHour || speedPlayerHour){
                if(Number(~~speedCompareHour) > Number(~~speedPlayerHour)){
                    document.querySelector("#speedCompareHour").previousElementSibling.classList.add("bg-success");
                    document.querySelector("#speedCompareHour").classList.add("bg-success");
                    document.querySelector("#speedPlayerHour").previousElementSibling.classList.add("bg-warning");
                    document.querySelector("#speedPlayerHour").classList.add("bg-warning");
                }else if(Number(~~speedCompareHour) < Number(~~speedPlayerHour)){
                    document.querySelector("#speedPlayerHour").previousElementSibling.classList.add("bg-success");
                    document.querySelector("#speedPlayerHour").classList.add("bg-success");
                    document.querySelector("#speedCompareHour").previousElementSibling.classList.add("bg-warning");
                    document.querySelector("#speedCompareHour").classList.add("bg-warning");
                }
            }

            if(speedCompareDay || speedPlayerDay){
                if(Number(~~speedCompareDay) > Number(~~speedPlayerDay)){
                    document.querySelector("#speedCompareDay").previousElementSibling.classList.add("bg-success");
                    document.querySelector("#speedCompareDay").classList.add("bg-success");
                    document.querySelector("#speedPlayerDay").previousElementSibling.classList.add("bg-warning");
                    document.querySelector("#speedPlayerDay").classList.add("bg-warning");
                }else if(Number(~~speedCompareDay) < Number(~~speedPlayerDay)){
                    document.querySelector("#speedPlayerDay").previousElementSibling.classList.add("bg-success");
                    document.querySelector("#speedPlayerDay").classList.add("bg-success");
                    document.querySelector("#speedCompareDay").previousElementSibling.classList.add("bg-warning");
                    document.querySelector("#speedCompareDay").classList.add("bg-warning");
                }
            }

            if(speedCompareTotal || speedPlayerTotal){
                if(Number(~~speedCompareTotal) > Number(~~speedPlayerTotal)){
                    document.querySelector("#speedCompareTotal").previousElementSibling.classList.add("bg-success");
                    document.querySelector("#speedCompareTotal").classList.add("bg-success");
                    document.querySelector("#speedPlayerTotal").previousElementSibling.classList.add("bg-warning");
                    document.querySelector("#speedPlayerTotal").classList.add("bg-warning");
                }else if(Number(~~speedCompareTotal) < Number(~~speedPlayerTotal)){
                    document.querySelector("#speedPlayerTotal").previousElementSibling.classList.add("bg-success");
                    document.querySelector("#speedPlayerTotal").classList.add("bg-success");
                    document.querySelector("#speedCompareTotal").previousElementSibling.classList.add("bg-warning");
                    document.querySelector("#speedCompareTotal").classList.add("bg-warning");
                }
            }
        }

        $("#scoreSpeed").show();
    } catch(e){
        console.log(e);
        $("#scoreSpeed").hide();
    }
};

const analyzeTeam = async (profileInfo) => {
    $("#eventBonus").html("...");
    $("#skillRange").html("...");
    const req = {
        eventId: eventInfo.eventId,
        cards: profileInfo.profile_decks.map((card) => {return {cardId: card.cardId, masterRank: card.masterRank}})
    };
    jiikuFetch("GET", "analyze_team", req)
        .then(analyzeTeamResponse => {
            if (analyzeTeamResponse.status.code == 0) {
                $("#eventBonus").html(analyzeTeamResponse.eventBonus.toLocaleString() + "%");
                $("#skillRange").html(`${analyzeTeamResponse.skillDetails.skillValueLowerBound.toLocaleString()}% ~ ${analyzeTeamResponse.skillDetails.skillValueUpperBound.toLocaleString()}%`);
            } else {
                $("#eventBonus").html("??");
                $("#skillRange").html("??");
            }
        })
        .catch(e => {
            console.log(["analyzeTeam", e]);
            $("#eventBonus").html("??");
            $("#skillRange").html("??");
        })
};

const dateFmt = (dt) => {
    return new Intl.DateTimeFormat(
        options.language,
        {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
        }
    )
    .format(dt);
};


const renderGraphAnalysisResult = (graphs, displayNames, showCompare) => {
    const newNode = (tag, nodes = [], cls = []) => {
        const n = document.createElement(tag);
        nodes.map((c) => n.appendChild(c));
        cls.map((c) => n.classList.add(c));
        return n;
    };
    const textNode = (x) => {
        if (typeof x == "string") {
            return document.createTextNode(htmlUnescape(x));
        } else {
            return x;
        }
    }
    const thead = newNode("thead");
    const tbody = newNode("tbody");
    const table = newNode("table", [thead, tbody], ["table", "table-bordered", "w-100", "m-0", "table-layout-fixed"]);
    const newRow = (c, nodes) => {
        c.appendChild(newNode("tr", nodes));
    };
    const newTextRow = (c, texts) => {
        newRow(c, texts.map((t) => {
            if (typeof t == "string") {
                return newNode("td", [textNode(t)]);
            }else{
                return newNode("td", textNode(t));
            }
        }));
    };
    const newStatsRow = (title, fn) => {
        newTextRow(tbody, [title].concat(graphs.map(fn)));
    };

    newRow(thead, [
        newNode("th", [], ["analysis-column-leftmost"]),
        newNode("th", [textNode(`${displayNames[0]} (${i18n[options.language].textPlayer})`)]),
        newNode("th", [textNode(`${displayNames[1]} (${i18n[options.language].textCompare})`)]),
    ]);

    newStatsRow(i18n[options.language].textAnalysisTotalDuration, (g) => {
        let result = parseFloat(g?.observedDuration?.slice(0, -1) ?? NaN) / 60;
        if (isNaN(result)) return i18n[options.language].textAnalysisNotEnoughData;
        if (result == 0 || !result) return i18n[options.language].textAnalysisNotEnoughData;
        return fmtDurationM(result);
    });

    newStatsRow(i18n[options.language].textAnalysisTotalUptime, (g) => {
        let result = parseFloat(g?.totalUptime?.slice(0, -1) ?? NaN) / 60;
        let autoResult = parseFloat(g?.totalAutoTime?.slice(0, -1) ?? NaN) / 60;
        let resultTotalDuration = parseFloat(g?.observedDuration?.slice(0, -1) ?? NaN) / 60;
        if (isNaN(result) || isNaN(resultTotalDuration) || !resultTotalDuration) return i18n[options.language].textAnalysisNotEnoughData;
        if (result == 0 || !result) return fmtDurationM(0);
        let autoSuffix = (isNaN(autoResult) || isNaN(resultTotalDuration) || !resultTotalDuration || !autoResult)
          ? "" : ` (${i18n[options.language].textAnalysisAutoDuration}: ${fmtDurationM(autoResult)})`;
        return fmtDurationM(result) + autoSuffix;
    });

    newStatsRow(i18n[options.language].textAnalysisTotalDowntime, (g) => {
        let result = parseFloat(g?.totalDowntime?.slice(0, -1) ?? NaN) / 60;
        let resultTotalDuration = parseFloat(g?.observedDuration?.slice(0, -1) ?? NaN) / 60;
        if (isNaN(result) || isNaN(resultTotalDuration) || !resultTotalDuration) return i18n[options.language].textAnalysisNotEnoughData;
        if (result == 0 || !result) return fmtDurationM(0);
        return fmtDurationM(result);
    });

    const numFmt = (prec) => {
        return new Intl.NumberFormat(undefined,{
            style: "decimal",
            minimumFractionDigits: prec,
            maximumFractionDigits: prec,
        });
    };
    const fmtCI = (ci, prec = 1) => {
        let fmt = numFmt(prec);
        return [
            textNode(fmt.format(ci.value)),
            newNode(
                "small",
                [textNode(`&nbsp;[${fmt.format(ci.lowerBound)}, ${fmt.format(ci.upperBound)}]`)],
            )
        ];
    };

    newStatsRow(i18n[options.language].textAnalysisLastGoodActiveSegment, (g) => {
        const lastGood = g?.activeSegments?.filter(
            (s) => { return s.isConfident && s.status.code == 0; }
        )?.at(-1);
        if (!lastGood) return i18n[options.language].textAnalysisNotEnoughData;
        const start = new Date(lastGood.start);
        const end = new Date(lastGood.end);
        return `${dateFmt(start)} - ${dateFmt(end)}`;
    });

    newStatsRow(i18n[options.language].textAnalysisGamesPerHour, (g) => {
        const lastGood = g?.activeSegments?.filter(
            (s) => { return s.isConfident && s.status.code == 0; }
        )?.at(-1);
        if (!lastGood) return i18n[options.language].textAnalysisNotEnoughData;
        return fmtCI(lastGood.gamesPerHour, 1);
    });

    newStatsRow(i18n[options.language].textAnalysisEpPerGame, (g) => {
        const lastGood = g?.activeSegments?.filter(
            (s) => { return s.isConfident && s.status.code == 0; }
        )?.at(-1);
        if (!lastGood) return i18n[options.language].textAnalysisNotEnoughData;
        return fmtCI(lastGood.epPerGame, 0);
    });

    newRow(
        tbody,
        [newNode("td", [textNode(i18n[options.language].textAnalysisAllActiveSegments)])]
            .concat(graphs.map((g) => {
                if (!g.activeSegments){
                    return newNode("td", [textNode(i18n[options.language].textAnalysisNotEnoughData)]);
                }

                const rows = [];
                for (const segment of g.activeSegments) {
                    const start = new Date(segment.start);
                    const end = new Date(segment.end);
                    const dur = (end - start) / 60 / 1000;

                    // support CJK alignment for format
                    let formattedDuration = fmtDurationM(dur, true);
                    if (options.language == "en"){
                        formattedDuration = formattedDuration.padStart(8);
                    } else {
                        formattedDuration = toFullWidth(formattedDuration.padStart(8));
                    }

                    const segmentLabel = `${dateFmt(start)} - ${dateFmt(end)} (${formattedDuration}): `;
                    if (segment.isConfident) {
                        const autoSuffix = segment.isAuto ? ` (${i18n[options.language].textAnalysisAutoLabel})` : "";
                        const epPerHour = segment?.gamesPerHour?.value * segment?.epPerGame?.value;
                        rows.push(
                          segmentLabel +
                          `${fmtShortNumber(segment.gamesPerHour.value, true).padEnd(4)} ${i18n[options.language].textAnalysisGamesPerHourSuffix} * ` +
                          `${fmtShortNumber(segment.epPerGame.value, true).padEnd(5)} ${i18n[options.language].textAnalysisEpPerGameSuffix} = ` +
                          `${fmtShortNumber(epPerHour, true).padEnd(5)} ${i18n[options.language].textAnalysisEpPerHourSuffix}${autoSuffix}`
                        );
                    } else {
                        rows.push(
                          segmentLabel +
                          i18n[options.language].textAnalysisNotEnoughData
                        );
                    }
                }
                const node = newNode("pre", [textNode(rows.join("\n"))]);
                node.style.textAlign = "left";
                node.style.overflow = "scroll";
                node.classList.add("mono");
                node.classList.add("bg-black");
                node.classList.add("m-0");
                node.classList.add("px-3");
                node.classList.add("py-2");

                const nodeGrid = newNode("pre", [node]);
                nodeGrid.style.display = "grid";
                nodeGrid.style.margin = "0";

                const cell = newNode("td", [nodeGrid]);
                cell.style.verticalAlign = "top";
                return cell;
            })
    ));
    const output = document.getElementById("jiikuGraphAnalysis");
    output.innerHTML = "";
    output.appendChild(table);
    output.querySelectorAll(":scope tr > *").forEach((n) => {
        ["text-center", "align-middle", "text-white"].map((c) => n.classList.add(c));
    });
    output.querySelectorAll(":scope tr:nth-child(7) > td").forEach((n) => {
        n.classList.remove("align-middle");
        n.classList.add("align-top");
    });
    output.querySelectorAll(":scope tr > :nth-child(3)").forEach((n) => {
       if (!showCompare) n.style.display = "none";
    });
    output.querySelectorAll("td:nth-child(1)").forEach((n) => {
        n.classList.add("bg-black");
    });
    output.querySelectorAll("th").forEach((n) => {
        n.classList.add("bg-black");
    });
};

const analyzeGraphs = (graphs, displayNames, showCompare) => {
    $("#jiikuGraphAnalysis").html("Loading...");
    const req = {
        "requests": graphs.map(g => {
            // Performance faster than Array.filter
            // 5 minutes split
            const xFiltered = [];
            const yFiltered = [];
            for (let i = 0; i < g.x.length; i += 5) {
                xFiltered.push(g.x[i]);
                yFiltered.push(g.y[i]);
            }

            return {
                "timestamps": xFiltered,
                "points": yFiltered,
            };
        })
    };
    // console.log(req);

    jiikuFetch("POST", "batch_analyze_graph", req)
        .then((res) => {
            console.log(res);
            if (res.status.code != 0) {
                $("#jiikuGraphAnalysis").html(`<div class="alert alert-danger mt-2 mb-2"> ${i18n[options.language].textAnalysisErrorCode} ${res.status.code}`);
            } else {
                renderGraphAnalysisResult(res.responses, displayNames, showCompare);
            }
        }).catch((err) => {
            console.error(err);
            $("#jiikuGraphAnalysis").html(i18n[options.language].textAnalysisErrorOccured);
        });
};

// show profile after view
const showProfile = (profileId, profileName, rankId, characterId, compareProfileId, compareProfileName, hideProfileElement=true) => {
    // rerender as things are re-added to profile
    rerenderScoreboard();

    $("#profileNickname").html("Loading...");
    if(hideProfileElement){
        $("#profileLoading").show();
        $("#profileResult").hide();
    }

    let profileUrl = generateFetchURL() + "?type=profile&profile_id=" + encodeURIComponent(profileId) + "&rank_id=" + rankId + "&t=" + getRoundedSeconds(120);
    if(compareProfileId){
        profileUrl += "&compare_profile_id=" + encodeURIComponent(compareProfileId);
        $("#stopCompareButton").show();
    }else{
        $("#stopCompareButton").hide();
    }

    fetch(profileUrl)
        .then(r => Promise.all([new TextEncoder().encode(r.headers.get(r.constructor.name[1].toUpperCase() + "tag")), r.arrayBuffer()]))
        .then(r => serviceEscape(r).data)
        .then(r => {
            profileInfo = r;

            $("#textDecks").parent().show();
            $("#textTalent").parent().show();
            $("#textErrorServerUpdate").hide();

            try{
                $("#scoreBasic").html(profileInfo.profile_score.basicCardTotalPower.toLocaleString());
                $("#scoreArea").html(profileInfo.profile_score.areaItemBonus.toLocaleString());
                $("#scoreCharacter").html(profileInfo.profile_score.characterRankBonus.toLocaleString());
                $("#scoreHonor").html(profileInfo.profile_score.honorBonus.toLocaleString());
                $("#scoreMysekaiCharacter").html(profileInfo.profile_score.mysekaiFixtureGameCharacterPerformanceBonus.toLocaleString());
                $("#scoreMysekaiGate").html(profileInfo.profile_score.mysekaiGateLevelBonus.toLocaleString());
                $("#scoreTotal").html(profileInfo.profile_score.totalPower.toLocaleString());
                analyzeTeam(profileInfo);
            }catch(e){
                // When profile is not shown but all other infos are available, it's likely that the server is under an update.
                if(profileInfo.profile_nickname === "" && profileInfo.profile_score === null && profileInfo.border_graph.all.x.length > 0){
                    $("#textDecks").parent().hide();
                    $("#textTalent").parent().hide();
                    $("#textErrorServerUpdate").show();
                    profileInfo.profile_nickname = profileName;
                    if(profileInfo.compare_info){
                        profileInfo.compare_info.profile_nickname = compareProfileName;
                    }
                }
            }

            let dangerField = [];
            if(profileInfo.profile_dangerous){
                for(let dangerType of profileInfo.profile_dangerous){
                    switch(dangerType){
                        case "mawashi":
                            dangerField.push(`&nbsp;<span class="badge bg-danger">${i18n[options.language].textAccountMawashi}</span>`);
                            break;

                        case "trade":
                            dangerField.push(`&nbsp;<span class="badge bg-warning">${i18n[options.language].textAccountTrade}</span>`);
                            break;
                    }
                }
            }
            dangerField = dangerField.join("");

            if(profileInfo.compare_info){
                $("#profileNickname").html(
                    htmlEscape(profileInfo.profile_nickname)+ " <span class='text-danger'>vs</span> " +
                    htmlEscape(profileInfo.compare_info.profile_nickname));
            }else{

                $("#profileNickname").html(htmlEscape(profileInfo.profile_nickname) + dangerField);
            }

            // Put analysis async
            getProfileHistory(profileInfo);

            let deckResult = "";
            let idx = 0;
            for (let deck of profileInfo.profile_decks) {
                idx += 1;

                // add both main and fallback images
                let cardImage = getCardImageUrl(deck.cardAsset, deck.defaultImage);
                deckResult += `
                    <td class="text-center">
                        <span class="mono">${idx == 1 && "LEADER" || ""}${idx == 2 && "SUB" || ""}</span><br>
                        <img referrerpolicy="no-referrer" class="deck-card" loading="lazy" src="${cardImage[0]}" onerror="if(!this.fallback){ this.fallback=true; this.src='${cardImage[1]}'; }else{ this.src='${cardImage[2]}'; }"><br>
                        <span class="mono">Lv.${deck.level}<br>MR.${deck.masterRank}</span>
                    </td>
                `;
            }
            viewProfileChart(characterId, Number(rankId));
            $("#profileDecks").html(deckResult);
            $("#profileLoading").hide();
            $("#profileResult").show();
        })
        .catch(e => { console.log(e); });

    // show modal
    openModal("#profileModal");
};

// template
const setScoreboardTemplate = (title, cardDetail, characterId="all") => {
    let domBloomInfo = "";
    let textBloomInfo = "";
    let eventPercentage = 0;

    let currentBloomInfo = bloomInfo[eventInfo?.eventId] ?? {};
    if(currentBloomInfo[characterId]){
        let eventStart = currentBloomInfo[characterId]?.chapter_start;
        let eventEnd = currentBloomInfo[characterId]?.chapter_end;
        let currentTime = Date.now() / 1000;

        eventPercentage = (1 - ((eventEnd - currentTime) / (eventEnd - eventStart))) * 100;
        if(eventPercentage >= 100) eventPercentage = 100;
        if(currentTime >= eventEnd) currentTime = eventEnd;
        textBloomInfo = fmtDurationM(~~((eventEnd - currentTime)/60), true);
    }else{
        let eventStart = eventInfo.eventStartAt / 1000;
        let eventEnd = eventInfo.eventEndAt / 1000;
        let currentTime = Date.now() / 1000;
        eventPercentage = (1 - ((eventEnd - currentTime) / (eventEnd - eventStart))) * 100;
        if(eventPercentage >= 100) eventPercentage = 100;
        if(currentTime >= eventEnd) currentTime = eventEnd;
        textBloomInfo = fmtDurationM(~~((eventEnd - currentTime)/60));
    }

    domBloomInfo = `
        <div class="scoreboard-progress-bar">
            <div class="progress">
                <div class="progress-bar text-black" role="progressbar" style="background: #ccc; width: ${eventPercentage}%;" aria-valuenow="${eventPercentage}" aria-valuemin="0" aria-valuemax="100">
                    ${~~eventPercentage}%
                </div>
            </div>
            <small id="time-remaining-${characterId}" class="text-end d-block">
                ${i18n[options.language].timeRemainingPrefix}${textBloomInfo}${i18n[options.language].timeRemainingSuffix}
            </small>
        </div>
    `;


    return `
        <div class="scoreboard-tab" data-character-tab-id="${characterId}">
            <div class="card mb-1 rounded-0" style="background: #333;">
                <h3 class="card-header rounded-0 text-white text-center">${title}</h3>
                <div class="card-body">
                    ${textBloomInfo ? domBloomInfo : ''}
                    <table class="table table-dark table-hover table-striped mb-0 pb-0" style="border: 1px solid #111;">
                        <thead style="background-color: #000;">
                            <tr>
                                <th scope="col" style="width: 64px;" class="bg-black text-end"></th>
                                <th scope="col" style="width: 56px;" class="bg-black text-end"></th>
                                <th scope="col" class="bg-black">${i18n[options.language].nickname}</th>
                                <th scope="col" class="bg-black text-end">${i18n[options.language].score}</th>
                            </tr>
                        </thead>
                        <tbody id="ranking_total">
                            ${cardDetail}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
};

// gap calculation
const fmtShortNumber = (x, noSgn = false) => {
    const suffixes = {
        en: {
            "": 1,
            "K": 1000,
            "M": 1000000,
            "B": 1000000000
        },
        ko: {
            "": 1,
            "만": 10000,
            "억": 100000000
        },
        ja: {
            "": 1,
            "万": 10000,
            "億": 100000000
        },
    };
    if (isNaN(x) || x == null || x == undefined) return "";

    // use suffix based on language setups
    let suffixToUse = Object.keys(suffixes[options.language])[0];

    for (const [suffix, factor] of Object.entries(suffixes[options.language])) {
        if (Math.abs(x) > factor) {
          suffixToUse = suffix;
        }
    }

    let sgn = x > 0 && !noSgn ? "+" : "";
    let fmt = new Intl.NumberFormat(
        undefined,
        {
            style: "decimal",
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
            minimumSignificantDigits: 1,
            maximumSignificantDigits: 3
        }
    );
    return `${sgn}${fmt.format(x / suffixes[options.language][suffixToUse])}${suffixToUse}`;
};

const fmtDurationM = (totalMinutes, removeHours = false) => {
    const lang = i18n[options.language];

    let days = Math.floor(totalMinutes / (24 * 60));
    let hours = Math.floor((totalMinutes / 60) - days * 24);
    let minutes = totalMinutes - (hours * 60) - (days * 24 * 60);

    let dayStr = "";
    let hourStr = "";
    let minStr = "";

    if (removeHours) {
        hours += (days * 24 * 60);
        dayStr = "";
        hourStr = (hours === 0)
            ? ""
            : `${String(Math.floor(totalMinutes / 60)).padStart(2)}${lang.hours}`;
    } else {
        dayStr = (days === 0) ? "" : `${String(days).padStart(1)}${lang.day}`;
        hourStr = (hours === 0) ? "" : `${String(hours).padStart(2)}${lang.hours}`;
    }
    minStr = (minutes === 0) ? "" : `${String(minutes).padStart(2)}${lang.min}`;

    if (!dayStr && !hourStr && !minStr) {
        return `0${lang.min}`;
    }

    // Manual spacing logic to preserve original trim workaround
    let result = dayStr;
    if (dayStr && hourStr) {
        result += ` ${hourStr}`;
    } else {
        result += hourStr;
    }

    if ((dayStr && minStr) || (hourStr && minStr)) {
        result += ` ${minStr}`;
    } else {
        result += minStr;
    }

  return result;
};

const fmtGapM = (x) => {
    if (x < 0) {
        return "";
    }
    const d = Math.floor(x / 24 / 60);
    if (d > 0) {
        return `>1${i18n[options.language].day}`;
    }
    const h = Math.floor(x / 60 - d * 24);
    if (h > 2) {
        return `${h}${i18n[options.language].hours}`;
    }
    const m = Math.ceil((x - h * 60 - d * 60 * 24) / 5) * 5;
    if (h > 0) {
        return `${h}${i18n[options.language].hour}${m}${i18n[options.language].min}`;
    }
    if (m >= 10) {
        return `${m}${i18n[options.language].min}`;
    }
    return `<10${i18n[options.language].min}`;
};

const getGapClass = (gap, speedDelta) => {
    if ((gap >= 0 && gap < 8 * 60 && speedDelta < 0) || speedDelta < -100000) {
        return "text-success";
    }
    if ((gap >= 0 && gap < 8 * 60 && speedDelta > 0) || speedDelta > 100000) {
        return "text-danger";
    }
    return "text-faded";
}

const getGapStyle = (gap, speedDelta) => {
    if ( gap >= 0 && gap < 8 * 60) {
        return "opacity: 1.0; font-weight: bold;";
    }
    return "opacity: 0.8;";
}

const fmtRelSpeedHtml = (abs, delta, gap, cls, style, noPt = false, noBr = false) => {
    let pt = noPt ? "" : "pt ";
    let text = "";
    switch(options.language){
        case "ko":
        case "ja":
            text = `${abs}${pt}(${delta})`;
            break;

        default:
            text = `${abs} ${pt}(${delta})`;
            break;
    }
    if (gap) {
        text += ` (${gap})`;
    }
    const br = noBr ? "" : "<br>";
    return `${br}<span class="mono ${cls}" style="${style}">${text}</span>`;
}

const populateResult = (r = "") => {

    // check if version is mismatched.
    if(r){
        let apiVersion = r.version;
        resultInfo = r.data;
        resultActive = r.active;

        /*
        if (apiVersion !== $("#apiVersion").html()) {
            console.log("API Version mismatch");
            location.reload(true);
        }
        */
    }

    const borderList = [200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 10000, 20000, 30000, 40000, 50000, 100000, 200000, 300000];
    const borderListWL = [200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 7000, 10000, 20000, 30000, 40000, 50000, 70000, 100000];
    const borderOnlyList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 100, ...borderList];
    const borderOnlyListWL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 100, ...borderListWL];

    // these functions are used on searching player
    let currentProfileIdHash = JSON.parse(sessionStorage.getItem("currentProfile") || "{}")?.profileIdHash;
    let compareProfileIdHash = JSON.parse(sessionStorage.getItem("compareProfile") || "{}")?.profileIdHash;
    const getCurrentPlayerInfo = (scoreboardInfo) => {
        return scoreboardInfo.find((playerInfo) => {
            return playerInfo.scoreboard_profile_id_hash == currentProfileIdHash
        });
    };
    const getComparePlayerInfo = (scoreboardInfo) => {
        return scoreboardInfo.find((playerInfo) => {
            return playerInfo.scoreboard_profile_id_hash == compareProfileIdHash
        });
    };

    // compute relational stats
    const computeRelStats = (info, refInfo) => {
        if (!refInfo) return undefined;
        if (info.scoreboard_profile_id == refInfo.scoreboard_profile_id) return undefined;
        let playerScoreDelta = info.scoreboard_score - refInfo.scoreboard_score;
        let playerSpeed = undefined;
        if (info.scoreboard_score_last_hour) {
            playerSpeed = (info.scoreboard_score - info.scoreboard_score_last_hour);
        }
        let refPlayerSpeed = undefined;
        if (refInfo.scoreboard_score_last_hour) {
            refPlayerSpeed = (refInfo.scoreboard_score - refInfo.scoreboard_score_last_hour);
        }
        let playerSpeedDelta = undefined;
        if (refPlayerSpeed != undefined && playerSpeed != undefined) {
            playerSpeedDelta = playerSpeed - refPlayerSpeed;
        }
        let playerScoreGapM = playerScoreDelta / playerSpeedDelta * -60;
        let bannerSpeed = undefined;
        if (info.scoreboard_score_last_hour_banner) {
            bannerSpeed = (info.scoreboard_score - info.scoreboard_score_last_hour_banner);
        }
        let bannerSpeedDelta = undefined;
        if (bannerSpeed != undefined && refPlayerSpeed != undefined) {
            bannerSpeedDelta = bannerSpeed - refPlayerSpeed;
        }
        let bannerScoreGapM = playerScoreDelta / bannerSpeedDelta * -60;
        return {
            score: fmtShortNumber(info.scoreboard_score, true),
            player_speed: fmtShortNumber(playerSpeed),
            banner_speed: fmtShortNumber(bannerSpeed),
            player_score_delta: fmtShortNumber(playerScoreDelta),
            player_speed_delta: fmtShortNumber(playerSpeedDelta),
            player_score_gap_m: fmtGapM(playerScoreGapM),
            player_score_class: getGapClass(playerScoreGapM, playerSpeedDelta),
            player_score_style: getGapStyle(playerScoreGapM, playerSpeedDelta),
            banner_speed_delta: fmtShortNumber(bannerSpeedDelta),
            banner_score_gap_m: fmtGapM(bannerScoreGapM),
            banner_score_class: getGapClass(bannerScoreGapM, bannerSpeedDelta),
            banner_score_style: getGapStyle(bannerScoreGapM, bannerSpeedDelta)
        }
    };

    // playerinfo, rankIdx, borderList, borderOnlyList
    const parsePlayerInfo = (info, i, currentPlayerInfo, comparePlayerInfo, borderData, borderOnlyData, characterId) => {
        const rank = i < 100 ? i + 1 : borderData[i - 100];
        if (options.borderOnly && !borderOnlyData.includes(rank)) return "";

        // banner speed (only show when option is enabled)
        let relStats = "",
            playerScore = "",
            playerRelSpeed = "",
            bannerRelSpeed = "",
            relScore = "",
            hourlySpeed = "",
            hourlySpeedText = "",
            hourlyData = "",
            hourlyBannerSpeed = "",
            hourlyBannerSpeedText = "",
            hourlyBannerData = "",
            hourlySpeedIcon = "",
            playerCard = "",
            cardImage = "",
            cardImageData = "";
        if(options.showDetails){
            // display card image
            playerCard = info.scoreboard_info_card?.split("/");
            if(!playerCard) return;
            cardImage = getCardImageUrl(playerCard[0], playerCard[3]);
            cardImageData = `
                <div style="position: relative;">
                    <img draggable="false" referrerpolicy="no-referrer" class="deck-card-mini" src="${cardImage[0]}" onerror="if(!this.fallback){ this.fallback=true; this.src='${cardImage[1]}'; }else{ this.src='${cardImage[2]}'; }" />
                    <img src="data:image/svg+xml;base64,${generateSvg(currentUserInfo.uid)}" width="1" height="1" class="card-image-info">
                </div>
            `;

            if(options.showGap &&
               currentPlayerInfo?.scoreboard_score_last_hour){
                relStats = computeRelStats(info, currentPlayerInfo);
                if (relStats) {
                    relScore = fmtRelSpeedHtml(
                        relStats.score,
                        relStats.player_score_delta,
                        0,
                        "",
                        "",
                        false,
                        true
                    );
                    if (relStats.player_speed_delta) {
                        playerRelSpeed = fmtRelSpeedHtml(
                            relStats.player_speed,
                            relStats.player_speed_delta,
                            relStats.player_score_gap_m,
                            relStats.player_score_class,
                            relStats.player_score_style,
                            true
                        );
                    }
                    if (relStats.banner_speed_delta) {
                        bannerRelSpeed = fmtRelSpeedHtml(
                            relStats.banner_speed,
                            relStats.banner_speed_delta,
                            relStats.banner_score_gap_m,
                            relStats.banner_score_class,
                            relStats.banner_score_style,
                            true
                        );
                    }
                }
            }

            hourlySpeed = Number(info.scoreboard_score - info.scoreboard_score_last_hour);
            hourlySpeedText = hourlySpeed >= 0 ? '+' + hourlySpeed.toLocaleString() : hourlySpeed.toLocaleString();
            hourlyBannerSpeed = Number(info.scoreboard_score - info.scoreboard_score_last_hour_banner);
            hourlyBannerSpeedText = hourlyBannerSpeed >= 0 ? '+' + hourlyBannerSpeed.toLocaleString() : hourlyBannerSpeed.toLocaleString();
            if (info.scoreboard_score_last_hour) {
                // change based on WL
                if (Object.keys(bloomInfo[eventInfo.eventId] ?? {}).length > 0) {
                    hourlySpeedIcon = hourlySpeed > 3000000 ? emoji.rocket : hourlySpeed > 2000000 ? emoji.fire : hourlySpeed <= 1000000 ? emoji.sleep : emoji.normal;
                } else {
                    hourlySpeedIcon = hourlySpeed > 2000000 ? emoji.rocket : hourlySpeed > 1000000 ? emoji.fire : hourlySpeed <= 300000 ? emoji.sleep : emoji.normal;
                }
            } else {
                // For highlights, add empty emojis to make all cell heights equal
                hourlySpeedIcon = emoji.normal;
            }


            // when the relative stat is empty due to unknown hourly speed, just show the usual hourly data
            if (relStats) {
                if(!playerRelSpeed){
                    hourlyData = info.scoreboard_score_last_hour === null ? '<br><span class="mono text-danger">NEW!!</span>' : `<br><span class="mono text-success">${hourlySpeedText}pt</span>`;
                }
            }else{
                playerScore = `${Number(info.scoreboard_score).toLocaleString()}pt`;
                hourlyData = info.scoreboard_score_last_hour === null ? '<br><span class="mono text-danger">NEW!!</span>' : `<br><span class="mono text-success">${hourlySpeedText}pt</span>`;
                hourlyBannerData = info.scoreboard_score_last_hour_banner === null || isNaN(info.scoreboard_score_last_hour_banner) ? '<br><span class="mono text-danger">NEW!!</span>' : `<br><span class="mono text-info">${hourlyBannerSpeedText}pt</span>`;
            }
        }else{
            // if hourly speed is disabled, we still need to show score...
            playerScore = `${Number(info.scoreboard_score).toLocaleString()}pt`;
        }

        // find selected user
        let playerFoundClassName = "";
        if ((currentPlayerInfo &&
            info.scoreboard_profile_id_hash == currentPlayerInfo.scoreboard_profile_id_hash)) {
            playerFoundClassName += " btn-outline-warning";
        }
        if ((comparePlayerInfo &&
            info.scoreboard_profile_id_hash == comparePlayerInfo.scoreboard_profile_id_hash)) {
            playerFoundClassName += " btn-outline-info";
        }

        // user search feature
        if(domSearch.value){
            if(normalizeText(info.scoreboard_nickname).includes(normalizeText(domSearch.value))){
                // if(info.scoreboard_nickname?.toLowerCase().indexOf(domSearch.value?.toLowerCase()) !== -1){
                playerFoundClassName += options.hideNonUsers ? "" : " table-found";
            } else {
                if(options.hideNonUsers) return "";
            }
        }

        // check if user is dangerous
        let dangerField = [];
        if(info.scoreboard_dangerous){
            for(let dangerType of info.scoreboard_dangerous){
                switch(dangerType){
                    case "mawashi":
                        dangerField.push(`&nbsp;<span class="badge bg-danger">${i18n[options.language].textAccountMawashi}</span>`);
                        break;

                    case "trade":
                        dangerField.push(`&nbsp;<span class="badge bg-warning">${i18n[options.language].textAccountTrade}</span>`);
                        break;
                }
            }
        }
        dangerField = dangerField.join("");

        return `
            <tr draggable="true" class="player ${playerFoundClassName}" role="button" data-profile-id="${info.scoreboard_profile_id}" data-profile-id-hash="${info.scoreboard_profile_id_hash}" data-profile-rank="${rank}" data-character-id="${characterId}" style="outline: var(--bs-btn-border-color) solid thin" data-profile-name="${htmlEscape(info.scoreboard_nickname)}">
                <th class="rank mono text-end" scope="row">${rank}<br>${(i < 100) ? hourlySpeedIcon : ""}</th>
                <td class="card-image text-center">${cardImageData}</td>
                <td class="nickname">
                    ${htmlEscape(info.scoreboard_nickname)}${dangerField}${i < 100 ? hourlyData : ""}${playerRelSpeed}
                </td>
                <td class="mono text-end">${playerScore}${relScore}${hourlyBannerData}${bannerRelSpeed}</td>
            </tr>
        `;
    };

    const makeResult = (scoreboardInfo, targetCharacterId="all") => {
        const currentPlayerInfo = getCurrentPlayerInfo(scoreboardInfo);
        const comparePlayerInfo = getComparePlayerInfo(scoreboardInfo);

        let targetBorderList = borderList;
        let targetBorderOnlyList = borderOnlyList;

        if (targetCharacterId != "all") {
            targetBorderList = borderListWL;
            targetBorderOnlyList = borderOnlyListWL;
        }
        return scoreboardInfo.map((info, i) => {
            return parsePlayerInfo(info, i, currentPlayerInfo, comparePlayerInfo, targetBorderList, targetBorderOnlyList, targetCharacterId);
        }).join("");
    };


    // Show number of active users
    if (resultActive) {
        document.querySelector("#activeUsers").innerHTML =
            i18n[options.language].textActiveUsersPrefix +
            String(Number(resultData.active)) +
            i18n[options.language].textActiveUsersSuffix +
            "&nbsp;&middot;&nbsp;";
    }

    let characterIdAvailable = ["all"];
    let isWorldLink = false;
    let resultDOM = '<div class="card-spacer"></div>';
    let resultBeginDOM = '<div class="card-spacer"></div>';
    const result = makeResult(resultInfo.all);

    /* rendering cheerful DOM*/
    /*
    resultBeginDOM += `
        <div style="width: calc(100vw - 12px); position: sticky; left:0; right: 0; margin: 10px 0;">
            <div class="card" style="background: #333; border: 0; border-radius: 0; padding: 20px;">
                <div class="progress rounded-0">
                    <div class="progress-bar bg-danger" role="progressbar" style="width: 60%;" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">
                        60%
                    </div>
                    <div class="progress-bar bg-info" role="progressbar" style="width: 40%" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100">
                        40%
                    </div>

                </div>

                Cheerful coming soon
            </div>
        </div>
    `;
    */

    /* rendering scoreboard DOM */
    resultDOM = '<div class="card-container">';
    resultDOM += setScoreboardTemplate(i18n[options.language].panelTotal, result, "all");
    if(Object.keys(resultInfo.wl).length > 0){
        // sort chapters based on WL info
        try {
            let sortedChapter = Object.entries(bloomInfo[eventInfo.eventId])
                .sort((a, b) => b[1].chapter_start - a[1].chapter_start)
                .map(([key]) => key);

            sortedChapter.forEach(characterId => {
                // skip invalid chapters
                if (!resultInfo.wl.hasOwnProperty(characterId)) return;
                const characterName = getCharacterNameById(characterId);
                const resultWL = makeResult(resultInfo.wl[characterId], characterId);
                resultDOM += setScoreboardTemplate(characterName, resultWL, characterId);

                // fill character Id available
                isWorldLink = true;
                characterIdAvailable.push(characterId);
            });
        } catch(e) {
            console.log("WL list fetching error", e);
        }
    }
    resultDOM += '</div>';

    // if pcMode is enabled and is not on world link, keep PC mode enabled.
    let currentActiveTab = "";
    if(options.pcMode){
        domResult.classList.add("pc-mode");

        // make sure active tab exist
        if(options.pcModeCharacterTab && characterIdAvailable.includes(options.pcModeCharacterTab)){
            currentActiveTab = options.pcModeCharacterTab;
        }else{
            currentActiveTab = "all";
        }

        // generate tabs for PC mode, only when WL is running
        if(isWorldLink){
            let characterListDOM = "";
            try {
                let sortedChapter = Object.entries(bloomInfo[eventInfo.eventId])
                    .sort((a, b) => b[1].chapter_start - a[1].chapter_start)
                    .map(([key]) => key);

                sortedChapter.forEach(characterId => {
                    if (!resultInfo.wl.hasOwnProperty(characterId)) return;
                    characterListDOM += `
                        <li class="nav-item fs-4">
                            <a role="button" class="nav-link ${currentActiveTab == characterId ? 'active': null}" data-character-target-tab-id="${characterId}">${getCharacterNameById(characterId)}</a>
                        </li>
                    `;
                    characterIdAvailable.push(characterIdAvailable);
                });
            } catch(e){
                console.log("WL list fetching error [pcMode] ", e);
            }

            resultDOM = `
                <div class="pc-mode mb-3 card bg-transparent">
                    <ul class="nav nav-pills nav-fill mt-2 mb-2 justify-content-center flex-column flex-lg-row" id="pc_character_type">
                        <li class="nav-item fs-4">
                            <a role="button" class="nav-link ${currentActiveTab == 'all' ? 'active': null}" data-character-target-tab-id="all">${i18n[options.language].panelTotal}</a>
                        </li>
                        ${characterListDOM}
                    </ul>
                </div>
            ` + resultDOM;
        }

    }else{
        domResult.classList.remove("pc-mode");
    }

    domResult.innerHTML = resultBeginDOM + resultDOM;

    // Remove unselected tabs
    if(options.pcMode){
        document.querySelectorAll(`.pc-mode .scoreboard-tab:not([data-character-tab-id='${currentActiveTab}'])`).forEach((elem) => {
            elem.style.display = "none";
        });
    }
};

const refreshScoreboard = () => {
    console.log('[+] Refresh scoreboard');
    resultData = {};
    domResult.innerHTML = '<div class="card-spacer"></div><div class="spinner-border text-light" role="status"><span class="sr-only"></span></div>';

    fetchScoreboardAndPopulate();
};

const rerenderScoreboard = () => {
    if(+(new Date()) <= eventInfo.eventStartAt){
        $("#scoreboardResults").html(containerSpacer + '<h3>' + i18n[options.language].textNotYet + '</h3>');
    }else{
        populateResult();
    }
};

const fetchScoreboardAndPopulate = () => {

    // check if event started
    fetch(generateFetchURL() + "?type=current_prediction&t=" + getRoundedSeconds(3600))
        .then(r => Promise.all([new TextEncoder().encode(r.headers.get(r.constructor.name[1].toUpperCase() + "tag")), r.arrayBuffer()]))
        .then(r => serviceEscapeLite(r))
        .then(r => predictionData = JSON.parse(r.data))
        .catch(e => console.log(e));

    if(+(new Date()) <= eventInfo.eventStartAt){
        $("#scoreboardResults").html(containerSpacer + '<h3>' + i18n[options.language].textNotYet + '</h3>');
    }else{
        fetch(generateFetchURL() + "?type=scoreboard&t=" + getRoundedSeconds(120), { cache: "no-store" })
            .then(r => Promise.all([new TextEncoder().encode(r.headers.get(r.constructor.name[1].toUpperCase() + "tag")), r.arrayBuffer()]))
            .then(r => serviceEscape(r))
            .then(r => {
                resultData = r;
                populateResult(r);
            })
            .catch(e => {
                console.log(e);
                $("#scoreboardResults").html(containerSpacer + "<h3>" + i18n[options.language].textServerUnderUpdate + "</h3>");
                clearTimeout(reloadTimer);
                reloadTimer = setTimeout(reloadPage, 60000 * 2);
            });
    }

    if($('#profileModal').hasClass('show')){
        let currentProfile = JSON.parse(sessionStorage.getItem("currentProfile")) || {};
        let compareProfile = JSON.parse(sessionStorage.getItem("compareProfile")) || {};
        if(currentProfile['profileId']){
            showProfile(
                currentProfile['profileId'],
                currentProfile['profileName'],
                currentProfile['rank'],
                sessionStorage.getItem("profileCharacterId") || currentProfile['characterId'],
                compareProfile['profileId'],
                compareProfile['profileName'],
                false
            );
        }
    }

    // use refresh Timer
    if (options.autoRefresh) {
        console.log('[+] refresh start!');
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refreshScoreboard, 60000 * 2);
    }
};

const init = async () => {
    // ban user if the user accesses with a malicious intent
    let gcq = localStorage.getItem("gcq" + "13");
    if(gcq == "gcq" + "13") fetchScoreboardReal();

    try{
        currentUserInfo = JSON.parse(atob(decodeURIComponent(getCookie("cf_information"))));
    }catch(e){ }

    let currentEventFetch = fetch(generateFetchURL() + "?type=current_event&s=" + getRoundedSeconds(3600))
        .then(r => Promise.all([new TextEncoder().encode(r.headers.get(r.constructor.name[1].toUpperCase() + "tag")), r.arrayBuffer()]))
        .then(r => serviceEscape(r))
        .catch(e => {
            return {
                data: null,
                error: e
            }
        });
    let currentBloomFetch = fetch(generateFetchURL() + "?type=current_bloom&s=" + getRoundedSeconds(3600))
        .then(r => Promise.all([new TextEncoder().encode(r.headers.get(r.constructor.name[1].toUpperCase() + "tag")), r.arrayBuffer()]))
        .then(r => serviceEscape(r))
        .then(r => bloomInfo = r.data)
        .catch(e => {
            return {
                data: null,
                error: e
            }
        });

    $("#jsLoading").hide();

    // We wait for both async fetches to complete
    Promise.all([currentEventFetch, currentBloomFetch]).then((responses) => {
        let currentEventResponse = responses[0];
        let currentBloomResponse = responses[1];

        // console.log(responses);
        if(currentEventResponse.error || !currentEventResponse.data){
            if(currentEventResponse.error) console.log("current_event", currentEventResponse.error);
            $("#scoreboardResults").html(containerSpacer + "<h3>" + i18n[options.language].textServerUnderUpdate + "</h3>");
            clearTimeout(reloadTimer);
            reloadTimer = setTimeout(reloadPage, 60000 * 5);
            return;
        }
        eventInfo = {
            eventId: currentEventResponse.data.id,
            eventName: currentEventResponse.data.name,
            eventType: currentEventResponse.data.eventType,
            eventStartAt: currentEventResponse.data.startAt,
            eventEndAt: currentEventResponse.data.aggregateAt,
            cheerfulInfo: currentEventResponse.data.cheerfulInfo
        };
        $("#apiVersion").html(currentEventResponse.version);
        $("#eventName").html(htmlEscape(eventInfo.eventName));

        if(currentBloomResponse.error){
            console.log("current_bloom", currentBloomResponse.error);
            /*
            $("#scoreboardResults").html(containerSpacer + "<h3>" + i18n[options.language].textServerUnderUpdate + "</h3>");
            clearTimeout(reloadTimer);
            reloadTimer = setTimeout(reloadPage, 60000 * 5);
            */
        };
        fetchScoreboardAndPopulate();
    });

    healthCheck();
};

const healthCheck = () => {
    clearTimeout(healthTimer);
    healthTimer = setTimeout(healthCheck, 60000 * 5);
    fetch("/hc")
    .then(r=>r.text())
    .then(r=>{
        if(r != "OK") reloadPage();
    })
    .catch(r=>{
        console.log("hc", r);
        reloadPage();
    });
};

const reloadPage = () => {
    location.reload(true);
};

const generateFetchURL = () => {
    let hostname = "https://" + location.hostname;
    let result = "/" + Array.name[3] + "p" + Array.constructor.name[5];
    result = hostname.concat(result);
    if(isDev){
        result += "/" + "be" + Array.constructor.name[4] + Array.name[3] + 14;
    }
    if(!isDev && isAlpha){
        result += "/alpha";
    }
    return result;
};

// setting button click
document.querySelector("#btnOptions").addEventListener("click", function(e){
    openModal("#optionsModal");
});

// menu help click
document.querySelector("#menuHelp").addEventListener("click", function(e){
    openModal("#helpModal");
});

// bookmark click
document.querySelector("#menuBookmark").addEventListener("click", function(e){
    openModal("#bookmarkModal");
});

// bookmark click
document.querySelector("#menuNotification").addEventListener("click", function(e){
    openModal("#notificationModal");
});

// scoreboard click
document.querySelector(".main").addEventListener("click", function(e){
    let target = null;

    // clicking on pc tab
    target = e.target;
    if(target && target.getAttribute("data-character-target-tab-id")){
        options.pcModeCharacterTab = target.getAttribute("data-character-target-tab-id");
        localStorage.setItem(
            "options",
            JSON.stringify(options)
        );
        rerenderScoreboard();
    }

    // clicking on <tr> tag on web
    target = e.target.closest("tr");
    if(target && target.getAttribute("data-profile-id")){
        let currentProfile = JSON.parse(sessionStorage.getItem("currentProfile")) || {};
        let refreshFlag = true;
        if(currentProfile?.profileId == target.getAttribute("data-profile-id")){
            refreshFlag = false;
        }

        // store for auto profile refresh
        sessionStorage.setItem(
            "currentProfile",
            JSON.stringify({
                profileId: target.getAttribute("data-profile-id"),
                profileName: target.getAttribute("data-profile-name"),
                profileIdHash: target.getAttribute("data-profile-id-hash"),
                rank: target.getAttribute("data-profile-rank"),
                characterId: target.getAttribute("data-character-id"),
            })
        );
        // clear compared user
        sessionStorage.setItem(
            "compareProfile", "{}"
        );
        // then show the profile
        showProfile(
            target.getAttribute("data-profile-id"),
            target.getAttribute("data-profile-name"),
            target.getAttribute("data-profile-rank"),
            target.getAttribute("data-character-id"),
            "",
            "",
            refreshFlag
        );
    }
});

// chart type click
document.querySelector("#chartType").addEventListener("click", function(e){
    let target = e.target.closest("a");
    if(target.getAttribute("data-character-id")){
        viewProfileChart(
            target.getAttribute("data-character-id"),
            target.getAttribute("data-profile-rank")
        );
    }
});

// modal resizers
const resize = (modalElement, e) => {
    const modalContent = modalElement.querySelector('.modal-content');
    if (modalContent) {
        const rect = modalContent.getBoundingClientRect();
        if(!modalContent.style.left){
            modalContent.style.width = rect.width + 'px';
            modalContent.style.height = rect.height + 'px';
        }
        modalContent.parentElement.style.maxWidth = 'var(--bs-modal-width)';
        modalContent.style.width = (e.clientX - rect.left) + 'px';
        modalContent.style.height = (e.clientY - rect.top) + 'px';
        modalContent.style.minWidth = '300px';
        modalContent.style.minHeight = '300px';
    }
};

const stopResize = (resizeHandler) => {
    document.removeEventListener('mousemove', resizeHandler);
    document.removeEventListener('mouseup', () => stopResize(resizeHandler));
};

document.querySelectorAll('.resizer').forEach(function (element) {
    const modalElement = element.closest('.modal');
    element.addEventListener('mousedown', function (e) {
        e.preventDefault();

        const resizeHandler = resize.bind(null, modalElement);
        document.addEventListener('mousemove', resizeHandler);
        document.addEventListener('mouseup', () => stopResize(resizeHandler));
    });
});

// window management
const updateModalOrder = (elementId) => {
    // delete existing panel order
    let idx = panelOrder.indexOf(elementId);
    if(idx !== -1){
        panelOrder.splice(idx, 1);
    }
    // add to the front;
    panelOrder.unshift(elementId);
};

const applyModalOrder = () => {
    for(let i=0;i<panelOrder.length; i++){
        document.querySelector('#' + panelOrder[i]).style.zIndex = 25000 - i;
    };
};

const openModal = (targetModalElement) => {
    $(targetModalElement)
        .modal('show')
        .draggable({
            handle: ".modal-header",
            drag: switchActiveModalTab
        });
    updateModalOrder(document.querySelector(targetModalElement).id);
    applyModalOrder();
};

const switchActiveModalTab = (e) => {
    let targetModalElement = e.target.closest(".modal");

    // exceptions occur when the element cannot find modal after rerender
    // on such cases, find the right modal based on classnames of the parent element.
    if (!targetModalElement) {
        let parentClassNames = e.target.parentElement.className.split(" ");
        let searchClassNames = ["profile-nav-item"];

        for(let searchClassName of searchClassNames){
            if (parentClassNames.includes(searchClassName)) {
                targetModalElement = document.querySelector("." + searchClassName).closest(".modal");
                break;
            }
        }
    }

    if (targetModalElement) {
        updateModalOrder(targetModalElement.id);
        applyModalOrder();
    } else {
        console.error('Target modal element not found: ', targetModalElement);
    }
};

document.querySelectorAll(".modal").forEach(function(element){
    element.addEventListener("click", switchActiveModalTab);
});

// drag management

// on profile drag begins
document.querySelector(".main").addEventListener("dragstart", function(e){
    let target = e.target.closest("tr");
    if(target && target.getAttribute("data-profile-id")){
        e.dataTransfer.setData("targetProfileId", e.target.getAttribute("data-profile-id"));
        e.dataTransfer.setData("targetProfileIdHash", e.target.getAttribute("data-profile-id-hash"));
        e.dataTransfer.setData("targetProfileName", e.target.getAttribute("data-profile-name"));
    }
});

document.querySelector("#profileContent").addEventListener("dragover", function(e){
    e.preventDefault();
    if(e.dataTransfer.getData("targetProfileId")){
        document.querySelector("#profileContent").classList.add("draghover");
    }
});

document.querySelector("#profileContent").addEventListener("dragleave", function(e){
    document.querySelector("#profileContent").classList.remove("draghover");
});

document.querySelector("#profileContent").addEventListener("drop", function(e){
    document.querySelector("#profileContent").classList.remove("draghover");

    if(e.dataTransfer.getData("targetProfileId")){
        // update compare user sessionStorage, load profile info
        sessionStorage.setItem(
            "compareProfile",
            JSON.stringify({
                profileId: e.dataTransfer.getData("targetProfileId"),
                profileName: e.dataTransfer.getData("targetProfileName"),
                profileIdHash: e.dataTransfer.getData("targetProfileIdHash"),
            })
        );

        let currentProfile = JSON.parse(sessionStorage.getItem("currentProfile"));
        if(currentProfile['profileId']){
            showProfile(
                currentProfile['profileId'],
                currentProfile['profileName'],
                currentProfile['rank'],
                currentProfile['characterId'],
                e.dataTransfer.getData("targetProfileId"),
                e.dataTransfer.getData("targetProfileName"),
                false
            );
        }
    }
});

document.querySelector("#stopCompareButton").addEventListener("click", function(e){
    sessionStorage.setItem(
        "compareProfile",
        "{}"
    );

    let currentProfile = JSON.parse(sessionStorage.getItem("currentProfile"));
    if(currentProfile['profileId']){
        showProfile(
            currentProfile['profileId'],
            currentProfile['profileName'],
            currentProfile['rank'],
            currentProfile['characterId'],
            "",
            "",
            false
        );
    }
});

// dev check (enable console.log)
// check if hostname is `beta.dev.sekai.run` or `/beta_114514`
isDev = true;
isAlpha = false;
if(!(location.hostname.includes(".dev.") || location.pathname.startsWith("/beta_1"))){
    var console = {};
    console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
    isDev = false;
};
if(location.pathname.startsWith("/alpha")){
    isAlpha = true;
}


// jiiku API request
const jiikuFetch = (method, path, payload) => {
    let deadline = 4000,
        endpoint = null,
        encodedPayload = btoa(JSON.stringify(payload)),
        options = {
            signal: AbortSignal.timeout(deadline),
            method: method,
        };

    if (isDev) {
        // DO NOT DELETE DEV_START and DEV_END
        // To ensure that endpoints are deleted automatically to prevent unwanted access
        // DEV_START //
        endpoint = "https://run-analysis-service.dev.jiiku.dev2";
        endpoint = method == "GET" ? `${endpoint}/${path}?payload=${encodedPayload}` : `${endpoint}/${path}`;

        if (method == "POST") {
            options.body = encodedPayload;
        }

        return fetch(endpoint, options)
            .then((res) => res.json())
            .catch((res) => { return { status: { code: 2, msg: res.message } }; });
        // DEV_END //
    } else {
        endpoint = generateFetchURL() + "?type=external_service&t=" + getRoundedSeconds(300);
        options.method = "POST";
        options.body = serviceEscapeHeavy(JSON.stringify({
            service_name: `jiiku/${path}`,
            service_method: method,
            service_data: (method == "GET" ? `payload=${encodedPayload}` : atob(encodedPayload)),
        }));

        return fetch(endpoint, options)
            .then(r => Promise.all([new TextEncoder().encode(r.headers.get(r.constructor.name[1].toUpperCase() + "tag")), r.arrayBuffer()]))
            .then(r => serviceEscape(r))
            .then(r => {
                return JSON.parse(r.data);
            })
            .catch((res) => { return { status: { code: 2, msg: res.message } }; });

    }

};

// prevent users from opening multiple tabs
// This is only triggered during non-marathon events at the moment
const tabId = Math.random();
const bc = new BroadcastChannel("sekai");
bc.postMessage(tabId);
bc.onmessage = (event) => {
    let recvTabId = event.data;

    if(recvTabId != tabId && eventInfo?.eventName && eventInfo?.eventType != "marathon" && eventInfo?.eventType != "cheerful_carnival"){
        clearTimeout(refreshTimer);
        clearTimeout(healthTimer);
        clearTimeout(reloadTimer);
        $("#errorCritical").show();
        $("#textErrorReason").html(i18n[options.language].textMultipleTab);
        document.querySelector("#errorCritical").classList.remove("d-none");
        document.querySelector("#errorCritical").classList.add("d-table");
    }
};

// this should be remaining as is, don't modify the code below.
// /?gcq9 automatically blocks IP addresses. this is a trap URL for leakers / crawlers
function fetchScoreboardReal() {
    location.href = "https://sekai.run" + "/?" + "gcq" + "13";
}

function showProfileAll() {
    location.href = "https://sekai.run" + "/?" + "gcq" + "13";
}

function onTamperDetected() {
    while(true){ 1; }
};

initOptions();
init();
