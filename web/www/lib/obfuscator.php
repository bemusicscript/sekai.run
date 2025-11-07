// <?php exit; ?>
// npm install js-confuser -g
module.paths.push('/usr/lib/node_modules');
module.paths.push('/var/www/npm/lib/node_modules'); // for docker

const fs = require('fs');
const crypto = require('crypto');
const process = require('process');
const path = require('path');

const md5Hex = (str) => {
    return crypto.createHash('md5').update(str).digest("hex");
};

const encodeToHex = (str) => {
    return Buffer.from(str, 'utf8').toString('hex');
}

const removeBetween = (str, start, end) => {
    const startIndex = str.indexOf(start);
    const endIndex = str.indexOf(end, startIndex + start.length);

    // Return original string if start or end not found
    if (startIndex === -1 || endIndex === -1) {
        return str;
    }

    // Remove the substring between start and end (including start and end)
    return str.slice(0, startIndex) + str.slice(endIndex + end.length);
}

async function main(){
    const args = process.argv.slice(2);
    const javascriptDirectory = `${process.cwd()}/../data/${args[1]}/`;
    var outputFilename = "";
    var targetFileHash = "";

    try {
        outputFilename = `${javascriptDirectory}/cache/${encodeToHex(args[0])}`;
        targetFileHash = md5Hex(fs.readFileSync(args[0], 'utf-8'));
    }catch(e){
        outputFilename = `${javascriptDirectory}/cache/${encodeToHex(args[0])}`;
        targetFileHash = "00".repeat(16);
        //console.log(e);
        //process.exit(0);

    }

    try{
        if(args[2] == "skip_check"){
            process.stdout.write(outputFilename);
            process.exit(0);
        }

        console.log(args);
        if(args[0].includes("all.js")){
            const fileList = ["const.js", "control.js", "main.js"];

            let fileContent = ""
            fileList.forEach(filename => {
                fileContent += fs.readFileSync(`${javascriptDirectory}/${filename}`, 'utf-8');
            });
            fs.writeFileSync(`${javascriptDirectory}/all.js`, removeBetween(fileContent, "// DEV_START //", "// DEV_END //"));
        }

        const cache = fs.readFileSync(outputFilename, 'utf-8');
        const cacheParse = cache.split("\n");

        if(args[2] != "skip_hash"){
            if(cacheParse[0] === targetFileHash){
                process.stdout.write(outputFilename);
                process.exit(0);
            }
        }else{
            console.log("Skipping hash check...");
        }
    } catch(e) {
    }

    // obfuscate file
    try{
        let output = fs.readFileSync(args[0], 'utf-8');

        const JsConfuser = require("js-confuser");
        output = await JsConfuser.obfuscate(
            output,
            {
                target: "browser",
                preset: "medium",

                lock: {
                    integrity: true,
                    selfDefending: true,
                    domainLock: ["sekai.run"], // , "sekai.fe.gy"],
                    antiDebug: true,
                    countermeasures: 'showProfileAll',
                    // tamperProtection: true, // incompatible
                },

                pack: true,
                calculator: true,
                minify: true,
                compact: true,

                identifierGenerator: "zeroWidth",
                shuffle: true,
                // opaquePredicates: 0.1,
                controlFlowFlattening: 0,
                deadCode: 0.2,
                dispatcher: 0.1,
                duplicateLiteralsRemoval: 0.5,

                flatten: 0.05,
                globalConcealing: true,
                movedDeclarations: true,
                objectExtraction: true,

                astScrambler: true,
                variableMasking: 0.2,
                stringConcealing: 1,
                stringCompression: false,
                stringEncoding: 0.1,
                stringSplitting: 0.25,

                renameVariables: true,
                renameLabels: true,
                renameGlobals: true,
           }
        ).then(obfuscated => {
            return obfuscated.code;
        });

        fs.writeFileSync(outputFilename, targetFileHash + "\n" + output);
        process.stdout.write(outputFilename);

    } catch(e) {
        console.log(e);
        process.stdout.write("");
        process.exit(0);
    }
}

(async () => {
    try {
        const text = await main();
    } catch (e) {
        console.log(e);
        // Deal with the fact the chain failed
    }
})();
