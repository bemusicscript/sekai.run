import * as fs from 'fs';

(async() => {
    const now = () => +new Date();
    const randomNumber = (min, max) => {
        return Math.random() * (max - min) + min;
    };

    const downloadDataFromJiiku = async () => {
        let predictionData = await fetch("https://raw.githubusercontent.com/Jiiku831/Jiiku831.github.io/refs/heads/main/data/sekarun_current.json?t=" + now() + "&j=" + randomNumber(0, 100000*100000))
            .then((response) => response.text())
            .then((body) => body);

        await fs.writeFileSync('./data/sekarun.json', predictionData, err => {
            if (err) console.log(err);
        });

        console.log("[downloadData] Download Complete. (sekarun.json)");
        return JSON.parse(await fs.readFileSync('./data/sekarun.json', 'utf8'));
    };

    const downloadDataFromThree = async () => {
        let predictionData = await fetch("https://sekai-data.3-3.dev/predict.json?t=" + now())
            .then((response) => response.text())
            .then((body) => body);

        await fs.writeFileSync('./data/33.json', predictionData, err => {
            if (err) console.log(err);
        });

        console.log("[downloadData] Download Complete. (33.json)");
        return JSON.parse(await fs.readFileSync('./data/33.json', 'utf8'));
    };

    const getCurrentEventInfo = async () => {
        let eventInfo = await fetch("http://api.internal:5000/current_event")
            .then((response) => response.json())
            .then((body) => body);
        return eventInfo;
    };

    // parse from JSON
    const optimizeData = (res, eventId=null) => {
        let result = {};

        for(let [rank, rankInfo] of Object.entries(res)){
            if(!eventId){
                result.eventId = rankInfo.event_id;
            }
            let rankNumeric = Number(rank);

            for(let rankEntry of rankInfo['entries']){
                if (rankEntry.entry_type == "h") continue;
                if(!result[rankNumeric]) result[rankNumeric] = [];
                result[rankNumeric].push([rankEntry.timestamp, Math.trunc(rankEntry.ep)]);
            }
        };
        return result;
    };


    const init = async () => {
        /* Current event info (not used) */
        let eventInfo = await getCurrentEventInfo();
        let finalData = {
            eventId: eventInfo['id'],
            jiiku: {
                eventId: null,
                all: {},
                wl: {},
            },
            three: {
                eventId: null,
                all: {},
                wl: {},
            },
            run: {
                eventId: null,
                all: {},
                wl: {},
            },
        };

        // parse Jiiku stuff
        try{
            let predictionDataJiiku = await downloadDataFromJiiku();
            finalData.jiiku.all = optimizeData(predictionDataJiiku['lines']);
            finalData.jiiku.eventId = finalData.jiiku.all.eventId;
            delete finalData.jiiku.all.eventId;
            // worldLink predictions
            let databaseEventList = JSON.parse(fs.readFileSync('../app/database/json/worldBlooms.json', 'utf8'));
            for(let [chapterNo, chapterInfo] of Object.entries(predictionDataJiiku.chapters)){
                // get character ID
                let characterId = databaseEventList.filter(element => {
                    return element.eventId == finalData.jiiku.eventId && element.chapterNo == chapterNo
                })[0].gameCharacterId;
                finalData.jiiku.wl[characterId] = optimizeData(chapterInfo['lines'], finalData.jiiku.eventId);
            }
            console.log("[init] Jiiku parser done.");
        }catch(e){
            console.log("[init] Jiiku prediction parser failed");
            console.log(e);
        }

        fs.writeFileSync("./result.json", JSON.stringify(finalData));
    };

    init();
})();
