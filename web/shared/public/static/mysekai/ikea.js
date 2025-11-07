(async () => {
    const i18n = {
        ko: {
            title: "마이세카이 IKEA",
            introduction: "<b>마이세카이 IKEA&nbsp;(기여자: <span id='contributor-count'>...</span>명)</b><br>마이세카이의 입장을 허가하신 분들의 친구코드를 제공하고 있습니다.<br>친구코드를 목록에서 지우고 싶은 경우 1일간&nbsp;\"친구만 입장\"&nbsp; 혹은&nbsp;\"입장 거부\"&nbsp;로 설정하시기 바랍니다.<br><br>",
            showAll: "모든 가구 표시",
            fixtureName: "가구명",
            fixtureCount: "가구:",
            fixtureLocked: "스케치 불가",
            friendCode: "친구 코드",
            lastUpdated: "최근 업데이트:",
            search: "가구 검색",
        },
        en: {
            title: "Mysekai IKEA",
            introduction: "<b>Mysekai IKEA&nbsp;(contributed by <span id='contributor-count'>many</span> players)</b><br>All friend codes were shared by contributors from various sources, with their explicit permission for others to join their mysekai.<br>To delete the friend code from the list, simply change the settings to limit public users from joining your mysekai for a day.<br><br>",
            showAll: "Show All",
            fixtureName: "Name",
            fixtureCount: "Fixtures:",
            fixtureLocked: "Not Sketchable",
            friendCode: "Friend Code",
            lastUpdated: "Last Updated:",
            search: "Search...",
        },
        ja: {
            title: "マイセカイIKEA",
            introduction: "<b>マイセカイIKEA&nbsp;(貢献者: <span id='contributor-count'>...</span>名)</b><br>マイセカイに入場することを明示的に許可した方々のフレンドコードを提供しています。<br>フレンドコードを消したい方は１日間 「マイセカイの受け入れ」 を 「フレンドのみ」 または 「拒否」 に設定してください。<br><br>",
            showAll: "すべて表示",
            fixtureName: "家具の名前",
            fixtureCount: "家具:",
            fixtureLocked: "スケッチ不可",
            friendCode: "フレンドコード",
            lastUpdated: "更新日時:",
            search: "家具を検索する",
        }
    };

    // -------------------------
    // State & Constants
    // -------------------------

    const state = {
        totalFixtures: 0,
        deadFixtures: 0,
        rawData: null,
        userItemList: {},
        fixtureUserList: {},
        language: '',
    };

    const genreBlocklist = [
        "ディスプレイ",
        "ゲート",
        "キャンバス",
        "壁",
        "床",
        "カラータイル",
    ];

    // -------------------------
    // Utilities
    // -------------------------
    const normalizeText = (str) => {
        return str
            .normalize("NFKC")
            .replace(/[\u30a1-\u30f6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
            .toLowerCase();
    };

    const nonce = Math.random();
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(nonce * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    const getRoundedSeconds = (intervalSeconds) => {
        const coeff = 1000 * intervalSeconds;
        const now = Date.now();
        return Math.round(Math.floor(now / coeff) * coeff / 1000);
    };

    // -------------------------
    // Data Processing
    // -------------------------
    const sortDataByGenre = (data) => {
        return Object.entries(data).reduce((sorted, [itemId, entry]) => {
            let {
                genre_name,
                genre_sub
            } = entry;
            if(genre_sub == null){
                genreNameKeys = Object.keys(sorted[genre_name] ?? {});
                if(genreNameKeys.length > 0){
                    genre_sub = genreNameKeys[0];
                }else{
                    genre_sub = genre_name;
                }
            }
            sorted[genre_name] ??= {};
            sorted[genre_name][genre_sub] ??= {};
            sorted[genre_name][genre_sub][itemId] = entry;
            return sorted;
        }, {});
    };

    const updateUserAndFixtureMaps = (itemIdx, friendCodes) => {
        state.fixtureUserList[itemIdx] = friendCodes;
        friendCodes.forEach((uid) => {
            if (!state.userItemList[uid]) {
                state.userItemList[uid] = [itemIdx];
            } else if (!state.userItemList[uid].includes(itemIdx)) {
                state.userItemList[uid].push(itemIdx);
            }
        });
    };

    // -------------------------
    // Rendering Functions
    // -------------------------
    const generateTableRowHTML = (itemIdx, itemInfo, isBlocklisted, showAll) => {
        let classStatusFriendCode = "";
        let classStatusName = "text-bg-secondary";
        let classStatusImage = "";

        // Update user–fixture maps
        updateUserAndFixtureMaps(itemIdx, itemInfo.friend_codes);

        // Determine friend code background based on friend code count
        if (!isBlocklisted && itemInfo.is_sketchable) {
            state.totalFixtures++;
            if (itemInfo.friend_codes.length === 1 || itemInfo.friend_codes.length === 2) {
                classStatusFriendCode = "text-bg-warning";
            } else if (itemInfo.friend_codes.length === 0) {
                classStatusFriendCode = "text-bg-danger";
                state.deadFixtures++;
            }
        }

        // Shuffle friend codes for display and show up to 3
        shuffleArray(itemInfo.friend_codes);
        let itemResult = itemInfo.friend_codes.slice(0, 3).join("<br>");

        // If blocklisted or not sketchable, override display values if "show all" is enabled
        if (isBlocklisted || !itemInfo.is_sketchable) {
            if (!showAll) return "";
            itemResult = i18n[state.language].fixtureLocked;
            classStatusImage = "text-bg-light text-black";
            classStatusFriendCode = "text-bg-light text-black";
            classStatusName = "text-bg-light text-black";
        }

        // finally check if the keyword is matching
        let findUsername = sessionStorage.getItem("mysekaiSearchUsername") ?? "";
        findUsername = findUsername.trim();
        if (findUsername){
            if(!normalizeText(itemInfo.item_name).includes(normalizeText(findUsername))) return;
        }


        return `
              <tr>
                <td class="text-center ${classStatusImage} align-middle">
                  <img src="/assets/${itemInfo.path}" width="64" loading="lazy">
                </td>
                <td class="text-center ${classStatusName} align-middle">${itemInfo.item_name}</td>
                <td class="text-center ${classStatusFriendCode} align-middle">${itemResult}</td>
              </tr>
            `;
    };

    const generateTableHTML = (data, isBlocklisted) => {
        const showAll = localStorage.getItem("showAll") === "Y";
        return Object.entries(data)
            .map(([itemIdx, itemInfo]) =>
                generateTableRowHTML(itemIdx, itemInfo, isBlocklisted, showAll)
            )
            .join("");
    };

    const renderData = (sortedData) => {
        const showAll = localStorage.getItem("showAll") === "Y";
        let htmlContent = "";

        for (const [genreMain, genreData] of Object.entries(sortedData)) {
            const isBlocklisted = genreBlocklist.includes(genreMain);

            // Skip rendering blocklisted genres if "show all" is not enabled
            if (isBlocklisted && !showAll) continue;

            for (const [genreSub, fixtureList] of Object.entries(genreData)) {
                const title =
                    genreMain === genreSub ?
                    genreMain :
                    `${genreMain}&nbsp;&raquo;&nbsp;${genreSub}`;
                const tableRows = generateTableHTML(fixtureList, isBlocklisted);

                if (tableRows) {
                    htmlContent += `
                    <div class="col-md-12 col-lg-3 col-sm-12 col-xl-3">
                      <h4>${title}</h4>
                      <table class="table-dark table w-100 table-responsive">
                        <thead class="thead-dark">
                          <tr>
                            <th class="text-center"></th>
                            <th class="text-center">${i18n[state.language].fixtureName}</th>
                            <th class="text-center">${i18n[state.language].friendCode}</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${tableRows}
                        </tbody>
                      </table>
                    </div>
                  `;
                }
            }
        }
        // Spacer element
        htmlContent += `<div style="margin-left: 10px;">&nbsp;</div>`;
        return htmlContent;
    };

    const filterObsoleteUsers = (userItemMap, fixtureUserMap) => {
        const obsoleteUsers = new Set();

        Object.keys(userItemMap).forEach((user) => {
            // Only consider users with fewer than 40 items
            if (userItemMap[user].length >= 40) return;

            let canRemove = true;
            userItemMap[user].forEach((item) => {
                // If the fixture has between 1 and 5 friend codes, the user is retained
                if (fixtureUserMap[item].length > 0 && fixtureUserMap[item].length <= 5) {
                    canRemove = false;
                }
                // Remove the user from the fixture list
                fixtureUserMap[item] = fixtureUserMap[item].filter((u) => u !== user);
            });

            if (canRemove) {
                obsoleteUsers.add(user);
            }
        });

        return Array.from(obsoleteUsers);
    };

    const generateOutput = () => {
        requestAnimationFrame(() => {
            // Reset counters and maps for fresh rendering
            state.totalFixtures = 0;
            state.deadFixtures = 0;
            state.userItemList = {};
            state.fixtureUserList = {};

            // Display a loading message
            document.querySelector("#result").innerHTML =
                '<p style="margin-left:20px" id="loading">Loading...</p>';
            const sortedData = sortDataByGenre(state.rawData);
            const htmlResult = renderData(sortedData);
            document.querySelector("#result").innerHTML = htmlResult;

            // Update contributor count
            document.querySelector("#contributor-count").innerHTML = Object.keys(state.userItemList).length;

            // Update fixture availability statistics
            const availableCount = state.totalFixtures - state.deadFixtures;
            const fixtureAvailableRate = ((availableCount / state.totalFixtures) * 100).toFixed(1);
            const statusElement = document.querySelector("#available-fixtures-status");
            statusElement.classList.remove("text-bg-success", "text-bg-warning", "text-bg-danger");

            if (fixtureAvailableRate >= 99) {
                statusElement.classList.add("text-bg-success");
            } else if (fixtureAvailableRate >= 90) {
                statusElement.classList.add("text-bg-warning");
            } else {
                statusElement.classList.add("text-bg-danger");
            }
            document.querySelector("#available-fixtures").innerHTML =
                `${availableCount}/${state.totalFixtures} (${fixtureAvailableRate}%)`;

            // for debugging
            console.log(
                "[*] Pending deletion:",
                filterObsoleteUsers(state.userItemList, state.fixtureUserList)
            );
        });
    };

    // -------------------------
    // Language Rendering
    // -------------------------
    const renderLanguage = () => {
        requestAnimationFrame(() => {
            document.title = i18n[state.language].title;
            document.querySelector("#introduction").innerHTML = i18n[state.language].introduction;
            document.querySelector("#text-last-updated").innerHTML = i18n[state.language].lastUpdated;
            document.querySelector("#text-fixture-count").innerHTML = i18n[state.language].fixtureCount;
            document.querySelector("#text-show-all").innerHTML = i18n[state.language].showAll;
            document.querySelector("#search").placeholder = i18n[state.language].search;
        });
    };

    // -------------------------
    // Initialization
    // -------------------------
    const init = async () => {
        // set language
        let currentLanguage = navigator.language || navigator.userLanguage;
        if (!state.language) {
            switch (currentLanguage) {
                case "ko":
                case "ko-KP":
                case "ko-KR":
                    state.language = "ko";
                    break;

                case "ja":
                case "ja-JP":
                    state.language = "ja";
                    break;

                case "en-US":
                default:
                    state.language = "en";
                    break;
            }
        }
        await renderLanguage();

        // fetch JSON
        const url = `/ikea.json?t=${getRoundedSeconds(300)}&rev=2`;
        const response = await fetch(url);
        state.rawData = await response.json();
        const lastModified = response.headers.get("Last-Modified");
        document.querySelector("#last-updated").innerHTML = Intl.DateTimeFormat(state.language, {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "Asia/Tokyo",
        }).format(new Date(lastModified));
    };

    const setupEventListeners = () => {
        const showAllCheckbox = document.querySelector("#show-all-items");
        showAllCheckbox.checked = localStorage.getItem("showAll") === "Y";
        showAllCheckbox.addEventListener("change", (event) => {
            localStorage.setItem("showAll", event.target.checked ? "Y" : "N");
            generateOutput();
        });

        const searchInput = document.querySelector("#search");
        searchInput.value = sessionStorage.getItem("mysekaiSearchUsername") ?? "";
        searchInput.addEventListener("keyup", (event) => {
            sessionStorage.setItem("mysekaiSearchUsername", event.target.value);
            generateOutput();
        });
    };

    // Run initialization and render output
    await init();
    await setupEventListeners();
    generateOutput();

})();
