<?php
    if(!defined("SCOREBOARD")) die;
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
    <link rel="apple-touch-icon" href="/static/icon/icon.png">
    <link rel="manifest" href="/app.webmanifest" crossorigin="use-credentials">
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=M+PLUS+1&display=swap" crossorigin="anonymous">
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=M+PLUS+1+Code&display=swap" crossorigin="anonymous">
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Nanum+Gothic+Coding&display=swap" crossorigin="anonymous">
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Space+Mono&display=swap" crossorigin="anonymous">
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/@sun-typeface/suit@2.0.5/fonts/variable/woff2/SUIT-Variable.css" crossorigin="anonymous">
    <link rel="stylesheet" href="/static/twitter.css">
    <style>
        * { font-family: "M PLUS 1", "SUIT Variable", sans-serif !important; }
        #tweetPreview, code, pre { font-family: "M PLUS 1 Code", "Nanum Gothic Coding", "Space Mono" !important; }
    </style>
    <title>Twitter Recruit</title>
</head>
<body>
    <main>
        <div class="container">
            <div class="content">
                <form id="recruitmentForm">
                    <div class="input-group" style="background:#eaa; padding: 20px; color: #333;">
                        <span id="textGuideInfo"></span>
                    </div>

                    <div class="input-group">
                        <label class="mainLabel add-Border-01" id="textNoTimeline">TL放流有無</label>
                        <span id="textNoTimelineDescription"></span>
                        <div class="button-group" id="tlFlowButtons">
                            <button type="button" id="textYes" data-value="">あり</button>
                            <button type="button" id="textNo" data-value="@No_TL">なし</button>
                        </div>
                        <input type="hidden" id="tlFlow" value="">
                    </div>

                    <div class="input-group">
                        <label class="mainLabel add-Border-01" id="textRoomType">ルーム</label>
                        <div class="button-group" id="roomButtons">
                            <button type="button" id="textVeteran" data-value="ベテラン">ベテラン</button>
                            <button type="button" id="textFree" data-value="フリー">フリー</button>
                        </div>
                        <input type="hidden" id="room" value="">
                    </div>

                    <div class="input-group">
                        <label class="mainLabel add-Border-01" id="textMusic">楽曲</label>
                        <div class="button-group" id="songButtons">
                            <button type="button" id="textEbi"data-value="🦐">🦐</button>
                            <button type="button" id="textVivaHappy" data-value="ビバハピ">ビバハピ</button>
                            <button type="button" id="textLost" data-value="ロスエン">ロスエン</button>
                            <button type="button" data-value="Sage">Sage</button>
                            <button type="button" id="textOmakase" data-value="おまかせ">おまかせ</button>
                        </div>
                        <input type="hidden" id="song" value="">
                    </div>

                    <div class="input-group">
                        <label class="mainLabel add-Border-01" id="textCount">回数</label>
                        <span id="textCountDescription"></span>
                        <div class="button-group" id="roundsButtons">
                            <button type="button" id="textFastRun" data-value="高速周回">高速周回</button>
                            <button type="button" id="textRun" data-value="周回">周回</button>
                            <button type="button" id="textRunTwo" data-value="2回">2回</button>
                            <button type="button" id="textRunThree" data-value="3回">3回</button>
                            <button type="button" id="textRunFour" data-value="4回">4回</button>
                            <button type="button" id="textRunFive" data-value="5回">5回</button>
                        </div>
                        <input type="hidden" id="rounds" value="">
                    </div>

                    <div class="input-group">
                        <label class="mainLabel add-Border-01" id="textRemainingSlot">
                            残り枠
                        </label>
                        <div class="button-group" id="remainingSlotsButtons">
                            <button type="button" data-value="1">@1</button>
                            <button type="button" data-value="2">@2</button>
                            <button type="button" data-value="3">@3</button>
                            <button type="button" data-value="4">@4</button>
                        </div>
                        <input type="hidden" id="remainingSlots" value="">
                    </div>

                    <div class="input-group">
                        <label class="mainLabel add-Border-01" id="textRoomIcon">ルームID記号</label>
                        <div class="button-group" id="roomIdSymbolButtons">
                            <button type="button" data-value="🔑">🔑</button>
                            <button type="button" data-value="ルームID">ルームID</button>
                        </div>
                        <input type="hidden" id="roomIdSymbol" value="">
                    </div>

                    <div class="input-group">
                        <label class="mainLabel add-Border-01" id="textRoomNumber">ルームID</label>
                        <input type="text" id="roomId" maxlength="5" placeholder="ルームIDを入力してください">
                    </div>

                    <div class="skill-group">
                        <div class="input-group">
                            <label for="showHostSkill">
                                <span id="textHostSkill">主スキル値</span>
                                <label class="switch" for="showHostSkill">
                                    <input type="checkbox" id="showHostSkill" checked>
                                    <span class="slider round"></span>
                                </label>
                            </label>
                            <input type="text" id="hostSkill" maxlength="3" placeholder="スキル値を入力してください">
                        </div>
                        <div class="input-group">
                            <label for="showHostInnerValue">
                                <span id="textHostSkillTotal">主内部値</span>
                                <label class="switch" for="showHostInnerValue">
                                    <input type="checkbox" id="showHostInnerValue">
                                    <span class="slider round"></span>
                                </label>
                            </label>
                            <input type="text" id="hostInnerValue" class="hidden" maxlength="6" placeholder="内部値を入力してください">
                        </div>
                    </div>

                    <h2 id="hostRemarksHeader">
                        <span id="textHostOthers">募集主備</span>
                        <span id="hostRemarksToggle" class="arrow-down">▼</span></h2>
                    <div id="hostRemarksContainer">
                        <!-- 条件外人数を表示する -->
                        <div class="input-group">
                            <label for="showConditionOutside">
                                <span id="textHostMismatch">条件外人数を表示する</span>
                                <label class="switch" for="showConditionOutside">
                                    <input type="checkbox" id="showConditionOutside">
                                    <span class="slider round"></span>
                                </label>
                            </label>
                            <input type="text" id="conditionOutside" class="hidden" maxlength="2" placeholder="人数を入力">
                        </div>
                        <!-- 支援者人数を表示する -->
                        <div class="input-group">
                            <label for="showSupporter">
                                <span id="textHostSupport">支援者人数を表示する</span>
                                <label class="switch" for="showSupporter">
                                    <input type="checkbox" id="showSupporter">
                                    <span class="slider round"></span>
                                </label>
                            </label>
                            <input type="text" id="supporterCount" class="hidden" maxlength="2" placeholder="人数を入力">
                        </div>
                        <!-- 自由記述 -->
                        <div class="input-group">
                            <label for="showFreeDescription">
                                <span id="textAdditional">自由記述</span>
                                <label class="switch" for="showFreeDescription">
                                    <input type="checkbox" id="showFreeDescription">
                                    <span class="slider round"></span>
                                </label>
                            </label>
                            <textarea id="freeDescription" class="hidden" placeholder="自由記述を入力"></textarea>
                        </div>
                    </div>

                    <div class="skill-group">
                        <div class="input-group">
                            <label for="showRequiredSkill">
                                <span id="textRecruitSkill">募集スキル値</span>
                                <label class="switch" for="showRequiredSkill">
                                    <input type="checkbox" id="showRequiredSkill" checked>
                                    <span class="slider round"></span>
                                </label>
                            </label>
                            <input type="text" id="requiredSkill" maxlength="3" placeholder="スキル値を入力してください">
                        </div>
                        <div class="input-group">
                            <label for="showRequiredInnerValue">
                                <span id="textRecruitSkillTotal">募集内部値</span>
                                <label class="switch" for="showRequiredInnerValue">
                                    <input type="checkbox" id="showRequiredInnerValue">
                                    <span class="slider round"></span>
                                </label>
                            </label>
                            <input type="text" id="requiredInnerValue" class="hidden" maxlength="6" placeholder="内部値を入力してください">
                        </div>
                    </div>

                    <h2 id="recruitRemarksHeader"><span id="textRecruitRemarksHeader">募集備考</span> <span id="recruitRemarksToggle" class="arrow-down">▼</span></h2>
                    <div id="recruitRemarksContainer">
                        <div class="input-group">
                            <label for="showStar4">
                                <span id="textRecruitFourStar">☆４</span>
                                <label class="switch" for="showStar4">
                                    <input type="checkbox" id="showStar4">
                                    <span class="slider round"></span>
                                </label>
                            </label>
                        </div>
                        <div class="input-group">
                            <label for="showLongSession">
                                <span id="textRecruitLong">長時間できる方</span>
                                <label class="switch" for="showLongSession">
                                    <input type="checkbox" id="showLongSession">
                                    <span class="slider round"></span>
                                </label>
                            </label>
                        </div>
                        <div class="input-group">
                            <label for="showJudgementStrengthenDisabled">
                                <span id="textNoPerfect">判定強化✖</span>
                                <label class="switch" for="showJudgementStrengthenDisabled">
                                    <input type="checkbox" id="showJudgementStrengthenDisabled">
                                    <span class="slider round"></span>
                                </label>
                            </label>
                        </div>
                        <div class="input-group">
                            <label for="showJudgementAndRecoveryDisabled">
                                <span id="textNoPerfectAndHeal">判定/回復✖</span>
                                <label class="switch" for="showJudgementAndRecoveryDisabled">
                                    <input type="checkbox" id="showJudgementAndRecoveryDisabled">
                                    <span class="slider round"></span>
                                </label>
                            </label>
                        </div>
                        <div class="input-group">
                            <label for="showRecruitFreeDescription">
                                <span id="textAdditional">自由記述</span>
                                <label class="switch" for="showRecruitFreeDescription">
                                    <input type="checkbox" id="showRecruitFreeDescription">
                                    <span class="slider round"></span>
                                </label>
                            </label>
                            <textarea id="recruitFreeDescription" class="hidden" placeholder="自由記述を入力"></textarea>
                        </div>
                    </div>

                    <div class="input-group">
                        <label for="otherComments" id="textOtherComments">その他コメント</label>
                        <textarea id="otherComments" rows="1"></textarea>
                    </div>
                </form>
                <div class="preview">
                    <h2 id="textPreview">プレビュー</h2>
                    <div id="tweetPreview"></div>
                    <button id="closePreview">プレビューを閉じる</button>
                </div>
                <button id="togglePreview">プレビューを表示</button>
            </div>
            <div class="button-group">
                <button type="button" id="textGenerate" onclick="generateTweetLink()">リンク生成</button>
                <button type="button" id="saveHistoryButton">入力を保存する</button>
            </div>

            <div id="tweetLinkContainer" class="tweet-link"></div>
            <h2>
                <span id="textHistory">履歴</span>
                <label class="switch" for="historyToggle"> <input type="checkbox" id="historyToggle"> <span class="slider round"></span> </label>
            </h2>
            <div id="historyContainer">
                <ul id="historyList"></ul>
                <button id="clearAllHistoryButton">全履歴削除</button>
            </div>
        </div>
    </main>
    <footer class="footer" id="textCopyright"></footer>
    <script>
        i18n = {
            ko: {
                textNoTimeline: '타임라인에 표시',
                textNoTimelineDescription: '표시 설정시 팔로워의 타임라인에도 트윗이 노출됩니다.',
                textYes: '예',
                textNo: '아니오',
                textRoomType: '방 종류',
                textVeteran: '베테랑',
                textFree: '프리',
                textMusic: '악곡',
                textEbi: '🦐 엔비',
                textVivaHappy: '비바해피',
                textLost: '로앤파',
                textOmakase: '오마카세 (랜덤)',
                textCount: '횟수',
                textCountDescription: '고속주회: 결과창 안보고 바로 다음매치 이동할 것',
                textFastRun: '고속주회',
                textRun: '일반주회',
                textRunTwo: '2회',
                textRunThree: '3회',
                textRunFour: '4회',
                textRunFive: '5회',
                textRemainingSlot: '남은 인원',
                textRoomIcon: '방 번호 아이콘',
                textRoomNumber: '방 번호',
                textHostSkill: '방장 리더 스킬 %',
                textHostSkillTotal: '방장 덱 내부합',
                textHostOthers: '방장측 추가사항',
                textHostMismatch: '조건에 미달하는 사람 포함',
                textHostSupport: '지원자 포함',
                textAdditional: '자유기재',
                textRecruitSkill: '모집 리더 최소 스킬%',
                textRecruitSkillTotal: '모집 덱 최소 내부합',
                textRecruitFourStar: '☆４ 리더카드 필수',
                textRecruitLong: '장시간 주회 가능한 사람',
                textNoPerfect: '판정강화 ✖',
                textNoPerfectAndHeal: '판정강화덱/힐덱 ✖',
                textGenerate: '링크 생성',
                textHistory: '저장된 데이터&nbsp;',
                textPreview: '미리보기',
                closePreview: '미리보기 닫기',
                togglePreview: '미리보기 표시',
                clearAllHistoryButton: '기록 초기화',
                textOtherComments: '그 외 추가사항',
                saveHistoryButton: '기록 저장',
                textRecruitRemarksHeader: '모집 참고사항',
                textTweet: '트윗하기',
                textReuse: '재사용',
                textDelete: '삭제',
                textNoRoom: '방번호 없음',
                textErrorHalf: '숫자를 제대로 입력하세요.',
                textCopyright: '원작자: <a href="https://sekai-master.github.io/AssistTools/index.html">@Noritake</a> &middot; 번역: <a href="https://sekai.run">sekai.run</a>',
                textGuideInfo: '용어 및 스탬프 사용법 등을 모르는 경우 반드시 <a href="https://gall.dcinside.com/mgallery/board/view/?id=pjsekai&no=1626984">주회방 가이드</a>를 읽어주시기 바랍니다. <b>만약 규칙을 어기는 경우 타 플레이어에게 차단당할 수 있습니다.</b>',
            },
            en: {
                textNoTimeline: 'Show on Timeline',
                textNoTimelineDescription: "When enabled, your tweets can also be seen on your follower's timeline.",
                textYes: 'Yes',
                textNo: 'No',
                textRoomType: 'Type of room',
                textVeteran: 'Veteran',
                textFree: 'Free',
                textMusic: 'Music',
                textEbi: '🦐 Shrimp',
                textVivaHappy: 'Viva Happy',
                textLost: 'Lost and Found',
                textOmakase: 'Omakase (Random)',
                textCount: 'How many times are we playing',
                textCountDescription: 'Fast: stop reading results tab and move on for the next play<br>Fast/Normal: Play until host breaks the room.',
                textFastRun: 'Fast',
                textRun: 'Normal',
                textRunTwo: '2',
                textRunThree: '3',
                textRunFour: '4',
                textRunFive: '5',
                textRemainingSlot: 'Remaining slots',
                textRoomIcon: 'Room ID Icon',
                textRoomNumber: 'Room ID',
                textHostSkill: 'Host Leader %',
                textHostSkillTotal: 'Host ISV',
                textHostOthers: 'Additional comments from Host',
                textHostMismatch: 'Inlude no. of runners below minimum requirements',
                textHostSupport: 'Include no. of fills or supporters',
                textAdditional: 'Additional comments',
                textRecruitSkill: 'Recruit Min. Leader %',
                textRecruitSkillTotal: 'Recruit Min. ISV',
                textRecruitFourStar: 'Require at least ☆４',
                textRecruitLong: 'Only for those who can run together for a long time',
                textNoPerfect: 'Judgment Boost as a leader card is NOT ALLOWED',
                textNoPerfectAndHeal: 'Healer or Judgment Boost as a leader card is NOT ALLOWED',
                textGenerate: 'Generate Link',
                textHistory: 'History&nbsp;',
                textPreview: 'Preview',
                closePreview: 'Close Preview',
                togglePreview: 'Show Preview',
                clearAllHistoryButton: 'Reset History',
                textOtherComments: 'Additional Comments',
                saveHistoryButton: 'Save History',
                textRecruitRemarksHeader: 'Remarks for Recruitment',
                textTweet: 'Tweet',
                textReuse: 'Load',
                textDelete: 'Remove',
                textNoRoom: 'No Room ID',
                textErrorHalf: 'Enter numbers correctly.',
                textCopyright: 'Source: <a href="https://sekai-master.github.io/AssistTools/index.html">@Noritake</a> &middot; Translation: <a href="https://sekai.run">sekai.run</a>',
                textGuideInfo: 'Please consider reading this <a href="https://docs.google.com/document/u/0/d/1DlXZE25x0IwFiuNsLpXPdazt5miucMWUaXvMEIxuC34">The Twitter Room Handbook</a> to learn the terminologies, host stamps and rules.<br><b>Not following the stamps and rules would result in an in-game block from other players</b>.'
            },
            ja: {
                textErrorHalf: '数値は半角で入力してください',
                closePreview: 'プレビューを閉じる',
                togglePreview: 'プレビューを表示',
                textCopyright: 'ソース: <a href="https://sekai-master.github.io/AssistTools/index.html">@Noritake</a>',
            }
        };

        i18nPlaceholder = {
            ko: {
                roomId: '방번호를 입력하세요.',
                hostSkill: '리더의 스킬 퍼센트를 입력하세요.',
                hostInnerValue: '내부합을 입력하세요.',
                conditionOutside: '인원수를 입력하세요.',
                freeDescription: '자유롭게 입력하세요. (일본어로)',
                supporterCount: '인원수를 입력하세요.',
                requiredSkill: '리더의 최소 스킬 퍼센트를 입력하세요.',
                requiredInnerValue: '리더의 최소 내부합을 입력하세요.',
                recruitFreeDescription: '자유롭게 입력하세요. (일본어로)',
            },
            en: {
                roomId: 'Enter your room ID',
                hostSkill: "Enter host's leader card skill %",
                hostInnerValue: "Enter host's ISV",
                conditionOutside: "Enter how many runners are lower than recruit minimum req.",
                freeDescription: "Add additional comments (in Japanese)",
                supporterCount: "Enter how many supporters",
                requiredSkill: "Enter minimum leader skill %",
                requiredInnerValue: "Enter minimum ISV",
                recruitFreeDescription: "Add additional comments (in Japanese)",
            },
        };

        const renderLanguage = (lang) => {
            for(let [elem, value] of Object.entries(i18n[lang])){
                document.querySelectorAll("#" + elem).forEach((element) => {
                    element.innerHTML = value;
                });
            };
            for(let [elem, value] of Object.entries(i18nPlaceholder[lang])){
                document.querySelectorAll("#" + elem).forEach((element) => {
                    element.placeholder = value;
                });
            };
        };

        let currentLanguage = navigator.language || navigator.userLanguage;
        if(!localStorage.getItem("options")){
            switch(currentLanguage){
                case "ko":
                case "ko-KP":
                case "ko-KR":
                    language = "ko";
                    break;

                case "ja":
                case "ja-JP":
                    language = "ja";
                    break;

                case "en-US":
                default:
                    language = "en";
                    break;
            }
        }else{
            language = JSON.parse(localStorage.getItem("options"))?.language;
            if(!language){
                language = "en";
            }
        }
        if(language == "ja"){
            location.href='https://sekai-master.github.io/AssistTools/Pages/01_Tweet_Generator/tweet_generator.html';
        }else{
            renderLanguage(language);
        }
    </script>
    <script src="/static/twitter.js?t=5"></script>
</body>
</html>
