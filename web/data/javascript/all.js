// basic const
var refreshTimer = -1;
var healthTimer = -1;
var reloadTimer = -1;

var isDev = false;
var currentUserInfo = {
    uid: '',
    fid: '',
};

var bloomInfo = {};
var resultInfo = {};
var resultData = "";
var profileChart = null;
var profileInfo = {};

var domResult = document.querySelector("#scoreboardResults");
var domSearch = document.querySelector("#searchNickname");
var currentRound = 0;
var predictionData = [];

var options = {
    nickname: '',
    hideNonUsers: false,
    showDetails: true,
    autoRefresh: true,
    showGap: false,
    pcMode: true,
    pcModeCharacterTab: '',
    borderOnly: false,
    borderGraph: true,
    predictionGraph: false,
    playerGraph: true,
    language: null,
    noCache: false,
    daySpeed: false,
    notifications: {},
};

var eventInfo = {
    eventId: 0,
    eventName: '',
    eventStartAt: 0,
    eventEndAt: 0,
    eventType: '',
};
var panelOrder = [];

const generateSvg = (uid) => {
    let result = '';
    try{
        result = String(Number(uid).toString(16)).padStart(6, 0);
    }catch(e) {
        result = '000000';
    }

    return btoa(`
        <svg width="1" height="1" viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
            <rect x="0" y="0" width="1" height="1" fill="#${result}" shape-rendering="crispEdges" />
        </svg>`.trim());
};

const containerSpacer = `<div class="card-spacer"></div>`;
const emoji = {
    fire: `
        <picture>
            <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp" type="image/webp">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif" alt="🔥" width="19" height="19">
        </picture>
    `,
    rocket: `
        <picture>
            <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp" type="image/webp">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif" alt="🚀" width="19" height="19">
        </picture>
    `,
    sleep: `
        <picture>
            <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f634/512.webp" type="image/webp">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f634/512.gif" alt="😴" width="19" height="19">
        </picture>
    `,
    medalGold: `
        <picture>
            <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f947/512.webp" type="image/webp">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f947/512.gif" alt="🥇" width="32" height="32">
        </picture>
    `,
    medalSilver: `
        <picture>
            <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f948/512.webp" type="image/webp">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f948/512.gif" alt="🥈" width="32" height="32">
        </picture>
    `,
    medalBronze: `
        <picture>
            <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f949/512.webp" type="image/webp">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f949/512.gif" alt="🥉" width="32" height="32">
        </picture>
    `,
    globe: `
        <picture>
            <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f30f/512.webp" type="image/webp">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f30f/512.gif" alt="🌏" width="32" height="32">
        </picture>
    `,
    alarm: `
        <picture>
          <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/23f0/512.webp" type="image/webp">
          <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/23f0/512.gif" alt="⏰" width="19" height="19">
        </picure>
    `,
    normal: `
        <picture>
            <img src="/static/empty.png" alt="" width="19" height="19">
        </picture>
    `,
};

// get character list
const getCharacterNameById = (idx) => {
    let characterList = {
        ko: {
            1: "호시노 이치카",
            2: "텐마 사키",
            3: "모치즈키 호나미",
            4: "히노모리 시호",
            5: "하나사토 미누리",
            6: "키리타니 하루카",
            7: "모모이 아이리",
            8: "히노모리 시즈쿠",
            9: "아즈사와 코하네",
            10: "시라이시 안",
            11: "시노노메 아키토",
            12: "아오야기 토우야",
            13: "텐마 츠카사",
            14: "오오토리 에무",
            15: "쿠사나기 네네",
            16: "카미시로 루이",
            17: "요이사키 카나데",
            18: "아사히나 마후유",
            19: "시노노메 에나",
            20: "아키야마 미즈키",
            21: "하츠네 미쿠",
            22: "카가미네 린",
            23: "카가미네 렌",
            24: "메구리네 루카",
            25: "MEIKO",
            26: "KAITO",
            10000: "피날레",
        },
        en: {
            1: "Ichika Hoshino",
            2: "Saki Tenma",
            3: "Honami Mochizuki",
            4: "Shiho Hinomori",
            5: "Minori Hanasato",
            6: "Haruka Kiritani",
            7: "Airi Momoi",
            8: "Shizuku Hinomori",
            9: "Kohane Azusawa",
            10: "An Shiraishi",
            11: "Akito Shinonome",
            12: "Toya Aoyagi",
            13: "Tsukasa Tenma",
            14: "Emu Otori",
            15: "Nene Kusanagi",
            16: "Rui Kamishiro",
            17: "Kanade Yoisaki",
            18: "Mafuyu Asahina",
            19: "Ena Shinonome",
            20: "Mizuki Akiyama",
            21: "Miku", // Hatsune",
            22: "Rin", //  Kagamine",
            23: "Len", // Kagamine",
            24: "Luka", // Megurine",
            25: "MEIKO",
            26: "KAITO",
            10000: "Finale",
        },
        ja: {
            1: "星乃一歌",
            2: "天馬咲希",
            3: "望月穂波",
            4: "日野森志歩",
            5: "花里みのり",
            6: "桐谷遥",
            7: "桃井愛莉",
            8: "日野森雫",
            9: "小豆沢こはね",
            10: "白石杏",
            11: "東雲彰人",
            12: "青柳冬弥",
            13: "天馬司",
            14: "鳳えむ",
            15: "草薙寧々",
            16: "神代類",
            17: "宵崎奏",
            18: "朝比奈まふゆ",
            19: "東雲絵名",
            20: "暁山瑞希",
            21: "初音ミク",
            22: "鏡音リン",
            23: "鏡音レン",
            24: "巡音ルカ",
            25: "MEIKO",
            26: "KAITO",
            10000: "フィナーレ",
        }
    };
    return characterList[options.language][Number(idx)];
};

const i18n = {
    ko: {
        eventNotYet: '이벤트가 아직 시작되지 않았습니다.',
        title: '프로젝트 세카이 랭킹판',
        textRefresh: '새로고침',
        middot: '&nbsp;&thinsp;&middot;&thinsp;&nbsp;',
        bookmark: '북마크',
        options: '설정',
        help: '도움말',
        mysekai: '마이세카이',
        officialStore: '공식스토어',
        gallery: '프로젝트 세카이 갤러리',
        nicknameSearch: '닉네임 검색',
        optionHide: '조건과 다른 러너 숨기기<br><small class="text-muted">설정시 검색한 사용자의 닉네임만 랭킹판에 표시됩니다.</small>',
        optionHourly: '시속 표시<br><small class="text-muted">러너의 시속과 보더속도를 표시합니다.</small>',
        optionBorderOnly: '보더만 표시<br><small class="text-muted">상위 100위 전체 목록이 아닌 보더만 출력됩니다.</small>',
        optionRefresh: '자동 새로고침<br><small class="text-muted">1분마다 자동으로 랭킹판을 갱신합니다. 항상 켜두는 것을 권장합니다.</small>',
        optionPCMode: '랭킹판 넓게 보기<br><small class="text-muted">랭킹창이 크게 나옵니다.</small>',
        optionGap: '추월 모드 <span class="badge bg-info">NEW!</span> <br><small class="text-muted">선택한 러너 기준으로 상위 러너 추월에 필요한 최소 시간을 표시합니다.</small>',
        score: '점수',
        panelTotal: '종합',
        nickname: '닉네임',
        deckDefault: '기본 능력치: ',
        deckAreaBonus: '에리어 아이템 보너스: ',
        deckCharacterRankBonus: '캐릭터 랭크 보너스: ',
        deckHonors: '칭호 보너스: ',
        deckMysekaiCharacter: '가구 보너스: ',
        deckMysekaiGate: '게이트 보너스: ',
        deckTotal: '종합 능력치: ',
        deckEventBonus: '이벤트 보너스: ',
        deckSkillRange: '스킬 범위: ',
        stopCompare: '비교 중지',
        chartError: '차트를 찾을 수 없습니다.. 우우',
        chartScore: '점수 (pt)',
        chartTime: '시간',
        optionBorderGraph: '보더 진척도 보기',
        optionPlayerGraph: '러너 진척도 보기',
        labelDecks: '덱',
        labelTalent: '러너의 종합력',
        labelGraph: '진척도',
        textBorder: '보더',
        textBorderRank: '위',
        optionPredictionGraph: '예상 보더 보기',
        textPrediction: '예상',
        textNotYet: '이벤트 시작 전입니다.',
        labelSpeed: '평균 시속',
        optionDaySpeed: '일속으로 변경',
        textPlayer: '러너',
        textCompare: '상대',
        textPlayerSpeed: '러너 시속',
        textBorderSpeed: '보더 시속',
        textPredictionInformation: '예상 정보',
        textSpeedTimeTotal: '전체기간 평균',
        textSpeedTimeDay: '최근 24시간 평균',
        textSpeedTimeHour: '최근 1시간 평균',
        textServerUnderUpdate: '서버가 업데이트 중입니다.',
        textPredictionWarning: '예측 보더 데이터는 예상값이므로 참고용으로만 확인하십시오.<br>이 데이터를 사용하여 발생하는 불상사에 대해 개발자는 책임지지 않습니다. (<a target="_blank" href="https://jiiku831.github.io/sakirun.html"><b>출처</b></a>)',
        textMultipleTab: '본 이벤트 기간에는 랭킹판을 여러 탭에서 동시에 이용하실 수 없습니다.<br>서비스 이용에 불편을 드려 죄송합니다.',
        textRunAnalysis: '이벤런 분석',
        textRunAnalysisWarning: `만약 추론된 데이터가 이상한 경우 <a href="https://github.com/Jiiku831/sekai-public/issues/new" target="_blank"><b>여기</b></a>로 제보하시거나 호출벨을 이용하시기를 바랍니다.`,
        textAnalysisTotalDuration: '총 기록된 기간',
        textAnalysisTotalUptime: '가동 시간',
        textAnalysisTotalDowntime: '휴식 시간',
        textAnalysisAutoDuration: '오토 시간',
        textAnalysisAutoLabel: '오토',
        textAnalysisLastGoodActiveSegment: '최근 달린 구간',
        textAnalysisGamesPerHour: '시간당 판수 (G/hr) (최근 구간)',
        textAnalysisGamesPerHourSuffix: 'G/hr',
        textAnalysisEpPerGame: '판당 점수 (pt/G) (최근 구간)',
        textAnalysisEpPerGameSuffix: 'pt/G',
        textAnalysisEpPerHourSuffix: 'pt/hr',
        textAnalysisAllActiveSegments: '기록된 이벤런 구간',
        textAnalysisNotEnoughData: '데이터가 부족합니다.',
        textAnalysisErrorOccured: '에러가 발생했습니다.',
        textAnalysisErrorCode: '에러 코드',
        textHistory: '과거 이벤런 이력',
        textEventName: '이벤트명',
        textEventType: '종류',
        textNickname: '닉네임',
        textRank: '순위',
        textScore: '점수',
        textHistoryNotFound: '이력 없음',
        timeRemainingPrefix: '',
        timeRemainingSuffix: ' 남음',
        textSpeedLasthour: '최근 1시간 이력',
        textPlayCount: '회',
        textPlayMaximum: '최대',
        textPlayHourly: '시속',
        day: '일',
        hours: '시간',
        hour: '시간',
        min: '분',
        textActiveUsersPrefix: '현재 ',
        textActiveUsersSuffix: '명이 접속 중',
        notification: '알림',
        menuNotification: '알림 설정',
        text: '',
        textErrorServerUpdate: '게임 서버가 업데이트 중이므로 수집된 데이터만 표시됩니다.',
        textAccountMawashi: '대리',
        textAccountTrade: '거래계',
    },
    en: {
        eventNotYet: 'Event has not started yet!',
        title: 'Project Sekai Scoreboard',
        middot: '&nbsp;&thinsp;&middot;&thinsp;&nbsp;&thinsp;',
        textRefresh: 'Refresh',
        mysekai: 'Mysekai',
        bookmark: 'Bookmarks',
        officialStore: 'WebStore',
        help: 'How to Use',
        gallery: '',
        nicknameSearch: 'Search Nickname',
        options: 'Settings',
        optionHide: 'Hide All Runners<br><small class="text-muted">Enabling this will exclude runners that do not meet search conditions.</small>',
        optionHourly: 'Show Hourly Speed<br><small class="text-muted">Hourly speeds of individual tierers and borders will be displayed.<small>',
        optionBorderOnly: 'Border Runners Only<br><small class="text-muted">Only tierers right at the border will be displayed.<small>',
        optionRefresh: 'Auto Refresh<br><small class="text-muted">Refreshes the scoreboard in every minute.<br>It is strongly recommended to keep this ON.</small>',
        optionPCMode: 'Expand Scoreboard<br><small class="text-muted">Larger scoreboard will be displayed.</small>',
        optionGap: 'Overtake Mode <span class="badge bg-info">NEW!</span> <br><small class="text-muted">Based on the selected runner, the time to overtake other runners is displayed.</small>',
        score: 'Score',
        panelTotal: 'Overall',
        nickname: 'Nickname',
        stopCompare: 'Stop Compare',
        deckDefault: 'Base Talent: ',
        deckAreaBonus: 'Decoration Bonus: ',
        deckCharacterRankBonus: 'Character Rank Bonus: ',
        deckHonors: 'Title Bonus: ',
        deckMysekaiCharacter: 'Furniture Bonus: ',
        deckMysekaiGate: 'Gates Bonus: ',
        deckTotal: 'Total Talent: ',
        deckEventBonus: 'Event Bonus: ',
        deckSkillRange: 'Skill Range: ',
        chartError: 'Could not find the chart.. Uu..',
        chartScore: 'Score (pt)',
        chartTime: 'Time',
        optionBorderGraph: 'Border&#39;s graph',
        optionPlayerGraph: 'Tierer&#39;s graph',
        optionPredictionGraph: 'Prediction graph',
        textPrediction: 'Predicted',
        labelDecks: 'Current Deck',
        labelTalent: 'Talents (BP)',
        labelGraph: 'Progress Graph',
        textBorder: 'Border',
        textBorderRank: 'th',
        textNotYet: 'The event has not yet started!',
        labelSpeed: 'Average EP per hour',
        optionDaySpeed: 'Change to EP/day',
        textPlayer: 'Tierer',
        textCompare: 'Opponent',
        textPlayerSpeed: 'Tierer&#39;s Average Speed',
        textBorderSpeed: 'Border&#39;s Average speed',
        textPredictionInformation: 'Prediction Score',
        textSpeedTimeTotal: 'All times avg.',
        textSpeedTimeDay: 'Last 24 hours avg.',
        textSpeedTimeHour: 'Last 1 hour avg.',
        textServerUnderUpdate: 'Server is under update.',
        textPredictionWarning: 'The prediction data is for the reference.<br>Use this data at your own risk! (<a href="https://jiiku831.github.io/sakirun.html" target="_blank"><b>Source</b></a>)</b>',
        textMultipleTab: 'Due to high traffic, you cannot open the scoreboard on multiple tabs at the same time. Sorry for the inconvenience.',
        textRunAnalysis: 'Run Analysis',
        textRunAnalysisWarning: `Report bad inferences <a href="https://github.com/Jiiku831/sekai-public/issues/new" target="_blank">here</a>.`,
        textAnalysisTotalDuration: 'Observed Duration',
        textAnalysisTotalUptime: 'Total Uptime',
        textAnalysisTotalDowntime: 'Total Downtime',
        textAnalysisAutoDuration: 'Auto Time',
        textAnalysisAutoLabel: 'Auto',
        textAnalysisLastGoodActiveSegment: 'Last Active Segment',
        textAnalysisGamesPerHour: 'Games/Hour (G/hr) (Last Active)',
        textAnalysisGamesPerHourSuffix: 'G/hr',
        textAnalysisEpPerGame: 'EP/Game (pt/G) (Last Active)',
        textAnalysisEpPerGameSuffix: 'pt/G',
        textAnalysisEpPerHourSuffix: 'pt/hr',
        textAnalysisAllActiveSegments: 'All active segments',
        textAnalysisNotEnoughData: 'Not Enough Data',
        textAnalysisErrorOccured: 'An error occured.',
        textAnalysisErrorCode: 'Error code',
        textSpeedLasthour: 'Last 1 hour',
        textPlayCount: ' Games',
        textPlayMaximum: 'Max.',
        textPlayHourly: 'EP/h',
        textHistory: 'Past Run History',
        textEventName: 'Event Name',
        textEventType: 'Type',
        textNickname: 'Nickname',
        textRank: 'Rank',
        textScore: 'Score',
        textHistoryNotFound: 'No History',
        day: 'd',
        hours: 'hr',
        hour: 'h',
        min: 'm',
        timeRemainingPrefix: '',
        timeRemainingSuffix: ' remaining',
        textActiveUsersPrefix: '',
        textActiveUsersSuffix: ' users connected',
        textErrorServerUpdate: 'Game server is under maintenance. Only the collected data will be displayed.',
        textAccountMawashi: 'Mawashi',
        textAccountTrade: 'Traded',
    },
    ja: {
        eventNotYet: 'イベントはまだ始まっていません。',
        title: 'プロセカランキング表',
        middot: '&nbsp;&thinsp;&middot;&thinsp;&nbsp;&thinsp;',
        textRefresh: '再読み込み',
        bookmark: 'ブクマ',
        help: '使い方',
        mysekai: 'マイセカイ',
        officialStore: '公式ストア',
        gallery: '',
        nicknameSearch: 'ニックネーム検索',
        options: '設定',
        optionHide: '条件と異なるランナー非表示<br><small class="text-muted">オンすると、検索したランナーのみが表示されます。</small>',
        optionHourly: '時速表示<br><small class="text-muted">ランナーの時速とボーダーの時速が表示されます。</small>',
        optionBorderOnly: 'ボーダーのみ表示<br><small class="text-muted">ボーダー順位にいるランナーのみが表示されます。',
        optionRefresh: '自動更新<br><small class="text-muted">オンすると、1分ごとにランキング表を自動的に更新されます。<br>常にオンにしておくことを推奨します。</small>',
        optionPCMode: '広いランキング表<br><small class="text-muted">ランキング表が広く表示されます。</small>',
        optionGap: '追い越しモード <span class="badge bg-info">NEW!</span> <br><small class="text-muted">選択したランナーを基準に、上位のランナーを追い越すためにかかる時間が表示されます。</small>',
        score: 'スコア',
        stopCompare: '比較中止',
        panelTotal: '総合',
        nickname: 'ニックネーム',
        deckDefault: 'カードのみ総合力: ',
        deckAreaBonus: 'エリアアイテムボーナス: ',
        deckCharacterRankBonus: 'キャラクターランクボーナス: ',
        deckEventBonus: 'イベントボーナス: ',
        deckSkillRange: 'スキル範囲: ',
        optionPredictionGraph: '予想ボーダー',
        textPrediction: '予想ボーダー',
        deckHonors: '称号ボーナス: ',
        deckMysekaiCharacter: '家具ボーナス: ',
        deckMysekaiGate: 'ゲートボーナス: ',
        deckTotal: '総合力: ',
        chartError: 'チャートを見つかりませんでした。 うぅ',
        chartScore: 'スコア (pt)',
        chartTime: '時間',
        labelDecks: 'ユニット編成',
        labelTalent: '総合力',
        optionBorderGraph: 'ボーダーの進捗状況',
        optionPlayerGraph: 'ランナーの進捗状況',
        labelGraph: '進捗度',
        textBorder: 'ボーダー',
        textBorderRank: '位',
        textNotYet: 'イベントはまだ開始されていません。',
        textPredictionInformation: '予測情報',
        labelSpeed: '平均時速',
        optionDaySpeed: '日速に変更',
        textPlayer: 'ランナー',
        textCompare: '相手',
        textPlayerSpeed: 'ランナーの時速',
        textBorderSpeed: 'ボーダーの時速',
        textSpeedTimeTotal: '全体期間の平均',
        textSpeedTimeDay: '直近24時間の平均',
        textSpeedTimeHour: '直近1時間の平均',
        textServerUnderUpdate: 'アップデート中です.',
        textPredictionWarning: 'ボーダー予測はただの予想値であるため、ご利用は自己責任でお願いします。 (<a href="https://jiiku831.github.io/sakirun.html" target="_blank"><b>資料ソース</b></a>)',
        textMultipleTab: '複数のタブで同時にサービスをご利用いただくことはできません。<br>申し訳ございませんが、ひとつのタブでご利用ください。',
        textRunAnalysis: 'イベラン分析',
        textRunAnalysisWarning: `推論されたデータに異常がある場合は、<a href="https://github.com/Jiiku831/sekai-public/issues/new" target="_blank"><b>こちら</b></a>までお問い合わせください。`,
        textAnalysisTotalDuration: '記録された全体期間',
        textAnalysisTotalUptime: '稼働時間',
        textAnalysisTotalDowntime: '停止時間',
        textAnalysisAutoDuration: 'オート時間',
        textAnalysisAutoLabel: 'オート',
        textAnalysisLastGoodActiveSegment: '直近の稼働区間',
        textAnalysisGamesPerHour: '1時間あたりのプレイ回数 (G/hr) (直近の区間)',
        textAnalysisGamesPerHourSuffix: 'G/hr',
        textAnalysisEpPerGame: '1回あたりの獲得ポイント (pt/G) (直近の区間)',
        textAnalysisEpPerGameSuffix: 'pt/G',
        textAnalysisEpPerHourSuffix: 'pt/hr',
        textAnalysisAllActiveSegments: '記録されたイベラン区間',
        textAnalysisNotEnoughData: 'データが不足しています。',
        textAnalysisErrorOccured: 'エラーが発生しました。',
        textAnalysisErrorCode: 'エラーコード',
        textSpeedLasthour: '直近１時間の履歴',
        textPlayCount: '回',
        textPlayMaximum: '最大',
        textPlayHourly: '時速',
        textHistory: '過去のイベラン履歴',
        textEventName: 'イベント名',
        textEventType: '種類',
        textNickname: 'ニックネーム',
        textRank: '順位',
        textScore: 'スコア',
        textHistoryNotFound: '履歴なし',
        day: '日',
        hours: '時間',
        hour: '時間',
        min: '分',
        timeRemainingPrefix: 'あと ',
        timeRemainingSuffix: '',
        textActiveUsersPrefix: '現在',
        textActiveUsersSuffix: '人がアクセス中',
        textErrorServerUpdate: 'ゲームサーバーは現在メンテナンス中です。収集済みのデータのみ表示されます。',
        textAccountMawashi: '回し',
        textAccountTrade: 'RMT',
    }
};

// get cookie function
const getCookie = (name) => {
    function escape(s) { return s.replace(/([.*+?\^$(){}|\[\]\/\\])/g, '\\$1'); }
    var match = document.cookie.match(RegExp('(?:^|;\\s*)' + escape(name) + '=([^;]*)'));
    return match ? match[1] : null;
}

// intended to cache fetch requests
const getRoundedSeconds = (seconds) => {
    const coeff = 1000 * seconds;
    const now = new Date().getTime();
    return Math.round(Math.floor(now / coeff) * coeff / 1000);
};

// force redirect to root upon cloudflare challenge passage
const challengePassasgeCheck = (response) => {
    if (response.indexOf("#challenge-error-text") != -1 &&
        response.indexOf("__cf") != -1){
        // This hard reloads the page
        location.reload(true);
        return false;
    }
    return true;
};

const renderLanguage = () => {
    document.title = i18n[options.language].title;
    $(".middot").html(i18n[options.language].middot);
    $(".textOptions").html(i18n[options.language].options);
    $('#textRefresh').html(i18n[options.language].textRefresh);
    $('#textOptionHide').html(i18n[options.language].optionHide);
    $('#textOptionHourly').html(i18n[options.language].optionHourly);
    $('#textOptionBorderOnly').html(i18n[options.language].optionBorderOnly);
    $('#textOptionGap').html(i18n[options.language].optionGap);
    $('#textOptionRefresh').html(i18n[options.language].optionRefresh);
    $('#textOptionPCMode').html(i18n[options.language].optionPCMode);
    $('#searchNickname').attr("placeholder", i18n[options.language].nickname);
    $('#menuGallery').html(i18n[options.language].gallery);
    $('#menuBookmark').html(i18n[options.language].bookmark);
    $('#bookmarkTitle').html(i18n[options.language].bookmark);
    $('#menuNotification').html(i18n[options.language].notification);
    $('#menuHelp').html(i18n[options.language].help);
    $('#menuMysekai').html(i18n[options.language].mysekai);
    $('#menuOfficialStore').html(i18n[options.language].officialStore);
    $('#stopCompareButton').html(i18n[options.language].stopCompare);
    $('#deckDefault').html(i18n[options.language].deckDefault);
    $('#deckArea').html(i18n[options.language].deckAreaBonus);
    $('#deckCharacter').html(i18n[options.language].deckCharacterRankBonus);
    $('#deckTitle').html(i18n[options.language].deckHonors);
    $('#deckMysekaiCharacter').html(i18n[options.language].deckMysekaiCharacter);
    $('#deckMysekaiGate').html(i18n[options.language].deckMysekaiGate);
    $('#deckTotal').html(i18n[options.language].deckTotal);
    $('#deckEventBonus').html(i18n[options.language].deckEventBonus);
    $('#deckSkillRange').html(i18n[options.language].deckSkillRange);
    $('#deckDefaultCompare').html(i18n[options.language].deckDefault);
    $('#deckAreaCompare').html(i18n[options.language].deckAreaBonus);
    $('#deckCharacterCompare').html(i18n[options.language].deckCharacterRankBonus);
    $('#deckTitleCompare').html(i18n[options.language].deckHonors);
    $('#deckMysekaiCharacterCompare').html(i18n[options.language].deckMysekaiCharacter);
    $('#deckMysekaiGateCompare').html(i18n[options.language].deckMysekaiGate);
    $('#deckTotalCompare').html(i18n[options.language].deckTotal);
    $('#textOptionBorderGraph').html(i18n[options.language].optionBorderGraph);
    $('#textOptionPlayerGraph').html(i18n[options.language].optionPlayerGraph);
    $('#textOptionPredictionGraph').html(i18n[options.language].optionPredictionGraph);
    $('#chartError').html(i18n[options.language].chartError);
    $('#helpTitle').html(i18n[options.language].help);
    $('#textProfileGraph').html(i18n[options.language].labelGraph);
    $('#textDecks').html(i18n[options.language].labelDecks);
    $('#textTalent').html(i18n[options.language].labelTalent);
    $('#textSpeed').html(i18n[options.language].labelSpeed);
    $('.textPlayer').html(i18n[options.language].textPlayer);
    $('.textCompare').html(i18n[options.language].textCompare);
    $('.textBorder').html(i18n[options.language].textBorder);
    $('#textBorderSpeed').html(i18n[options.language].textBorderSpeed);
    $('#textPlayerSpeed').html(i18n[options.language].textPlayerSpeed);
    $('#textPlayerSpeedTimeTotal').html(i18n[options.language].textSpeedTimeTotal);
    $('#textPlayerSpeedTimeDay').html(i18n[options.language].textSpeedTimeDay);
    $('#textPlayerSpeedTimeHour').html(i18n[options.language].textSpeedTimeHour);
    $('#textBorderSpeedTimeTotal').html(i18n[options.language].textSpeedTimeTotal);
    $('#textBorderSpeedTimeDay').html(i18n[options.language].textSpeedTimeDay);
    $('#textBorderSpeedTimeHour').html(i18n[options.language].textSpeedTimeHour);
    $('#textPredictionWarning').html(i18n[options.language].textPredictionWarning);
    $('#textPredictionWarning').hide();
    $('#textRunAnalysis').html(i18n[options.language].textRunAnalysis);
    $('#textRunAnalysisWarning').html(i18n[options.language].textRunAnalysisWarning);
    $('#textOptionDaySpeed').html(i18n[options.language].optionDaySpeed);
    $('#textSpeedLasthour').html(i18n[options.language].textSpeedLasthour);
    $('.textNotifications').html(i18n[options.language].menuNotification);
    $('#textHistory').html(i18n[options.language].textHistory);
    $('#textEventName').html(i18n[options.language].textEventName);
    $('#textEventType').html(i18n[options.language].textEventType);
    $('#textNickname').html(i18n[options.language].textNickname);
    $('#textRank').html(i18n[options.language].textRank);
    $('#textScore').html(i18n[options.language].textScore);
    $('#textErrorServerUpdate').html(i18n[options.language].textErrorServerUpdate);

    // load bookmark and help from markdown files
    let cacheQuery = options.noCache ? Math.random() : getRoundedSeconds(3600);
    fetch(`/static/markdown/help-${options.language}.md?t=${cacheQuery}`)
        .then(r=> r.text())
        .then(r=> {
            if(!challengePassasgeCheck(r)) return;
            $('#helpBody').html(marked.parse(r));
        })
        .catch(r=> {
            if(!challengePassasgeCheck(r)) return;
            $('#helpBody').html(marked.parse(r));
        });

    fetch(`/static/markdown/bookmark-${options.language}.md?t=${cacheQuery}`)
        .then(r=> r.text())
        .then(r=> {
            // cloudflare challenge passage
            if(r.indexOf("challenge-error-text") != -1){
                location.href = '/';
                return;
            }
            $('#bookmarkBody').html(marked.parse(r));
        })
        .catch(r=> {
            // cloudflare challenge passage
            if(r.indexOf("challenge-error-text") != -1){
                location.href = '/';
                return;
            }
            $('#bookmarkBody').html(marked.parse(r));
        });
};

// options
const initOptions = () => {
    sessionStorage.setItem("currentProfile", "{}");
    sessionStorage.setItem("compareProfile", "{}");

    let _options = localStorage.getItem("options");
    if (!_options) {
        localStorage.setItem("options", JSON.stringify(options));
    } else {
        options = JSON.parse(_options);
    }

    // set language
    let currentLanguage = navigator.language || navigator.userLanguage;
    if(!options.language){
        switch(currentLanguage){
            case "ko":
            case "ko-KP":
            case "ko-KR":
                options.language = "ko";
                break;

            case "ja":
            case "ja-JP":
                options.language = "ja";
                break;

            case "en-US":
            default:
                options.language = "en";
                break;
        }
        localStorage.setItem("options", JSON.stringify(options));
    }

    if(options.language){
        $('#optionLanguage').find(`option[value=${options.language}]`)[0].selected = "selected";
    }
    renderLanguage();

    domSearch.value = options.nickname;
    $('#optionHide').prop('checked', options.hideNonUsers);
    $('#optionHourly').prop('checked', options.showDetails);
    $('#optionRefresh').prop('checked', options.autoRefresh);
    $('#optionGap').prop('checked', options.showGap);
    $('#optionPCMode').prop('checked', options.pcMode);
    $('#optionBorderOnly').prop('checked', options.borderOnly);
    $('#optionBorderGraph').prop('checked', options.borderGraph);
    $('#optionPlayerGraph').prop('checked', options.playerGraph);
    $('#optionPredictionGraph').prop('checked', options.predictionGraph);
    $('#optionDaySpeed').prop('checked', options.daySpeed);
    if(options.predictionGraph == true){
        $("#textPredictionWarning").show();
    }else{
        $("#textPredictionWarning").hide();
    }
    if (options.autoRefresh) {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refreshScoreboard, 60000 * 2);
    }
};

$('#optionHide').change((event) => {
    let value = $("#optionHide").prop('checked');
    options.hideNonUsers = value;
    localStorage.setItem("options", JSON.stringify(options));
    rerenderScoreboard();
});

$('#optionHourly').change((event) => {
    let value = $("#optionHourly").prop('checked');
    options.showDetails = value;
    localStorage.setItem("options", JSON.stringify(options));
    rerenderScoreboard();
});

$('#optionGap').change((event) => {
    let value = $("#optionGap").prop('checked');
    options.showGap = value;
    localStorage.setItem("options", JSON.stringify(options));
    rerenderScoreboard();
});

$('#optionPCMode').change((event) => {
    let value = $("#optionPCMode").prop('checked');
    options.pcMode = value;
    localStorage.setItem("options", JSON.stringify(options));
    rerenderScoreboard();
});

$('#optionBorderOnly').change((event) => {
    let value = $("#optionBorderOnly").prop('checked');
    options.borderOnly = value;
    localStorage.setItem("options", JSON.stringify(options));
    rerenderScoreboard();
});

$('#optionBorderGraph').change((event) => {
    let value = $("#optionBorderGraph").prop('checked');
    options.borderGraph = value;
    localStorage.setItem("options", JSON.stringify(options));
    viewProfileChart();
});

$('#optionPlayerGraph').change((event) => {
    let value = $("#optionPlayerGraph").prop('checked');
    options.playerGraph = value;
    localStorage.setItem("options", JSON.stringify(options));
    viewProfileChart();
});

$('#optionPredictionGraph').change((event) => {
    let value = $("#optionPredictionGraph").prop('checked');
    options.predictionGraph = value;
    if(options.predictionGraph == true){
        $("#textPredictionWarning").show();
    }else{
        $("#textPredictionWarning").hide();
    }
    localStorage.setItem("options", JSON.stringify(options));
    viewProfileChart();
});

$('#optionDaySpeed').change((event) => {
    let value = $("#optionDaySpeed").prop('checked');
    options.daySpeed = value;
    localStorage.setItem("options", JSON.stringify(options));
    viewProfileChart();
});

$('#optionRefresh').change((event) => {
    let value = $("#optionRefresh").prop('checked');
    options.autoRefresh = value;
    localStorage.setItem("options", JSON.stringify(options));
    if (value) {
        console.log('[+] refresh start!');
        refreshTimer = setTimeout(refreshScoreboard, 60000 * 2);
    } else {
        console.log('[-] refresh clear');
        clearTimeout(refreshTimer);
    }
});

$("#searchNickname").keyup((event) => {
    let value = event.target.value;
    options.nickname = value;
    localStorage.setItem("options", JSON.stringify(options));
    rerenderScoreboard();
});

$('#optionLanguage').change((event) => {
    let value = event.target.value;
    options.language = value;
    localStorage.setItem("options", JSON.stringify(options));
    renderLanguage();
    rerenderScoreboard();
});

// scroll MutationObserver
const observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
        if (localStorage.getItem("scroll")) {
            window.focus();
            window.scrollTo({
                top: localStorage.getItem("scroll"),
                behavior: 'instant'
            });
        }
	});
});
observer.observe(domResult, { childList: true });

// scroll save
window.addEventListener("scroll", (event) => {
    if (resultData) {
        localStorage.setItem("scroll", this.scrollY);
    }
});

const getChartOptions = () => {
    return {
        type: "line",
        data: {
            datasets: []
        },
        options: {
            responsive: true,
            aspectRatio: 2,
            animation: false,
            maintainAspectRatio: false,
            spanGaps: true,
            hover: {
                animationDuration: 0 // duration of animations when hovering an item
            },
            responsiveAnimationDuration: 0, // animation duration after a resize
            interaction: {
                mode: "nearest",
                intersect: false,
                axis: "x",
            },
            layout: {
                padding: 10
            },
            transitions: {
                zoom: {
                    animation: {
                        duration: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: "white",
                        font: {
                            family: "'M PLUS 1', 'SUIT Variable', sans-serif",
                        }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        drag: {
                            enabled: true,
                            drawTime: "beforeDatasetsDraw",
                        },
                        onZoomComplete: ({chart}) => {
                            const scaleTimeOptions = chart.options.scales.x.time;
                            const {min, max} = chart.scales.x;
                            const hours = (max - min) / (1000 * 60 * 60);
                            if (hours < 3) {
                                scaleTimeOptions.unit = "minute";
                                chart.update();
                            } else if (hours < 24) {
                                scaleTimeOptions.unit = "hour";
                                chart.update();
                            } else if (scaleTimeOptions.unit === "hour") {
                                scaleTimeOptions.unit = "day";
                                chart.update();
                            }
                        },
                        mode: 'x',
                        speed: 1,
                        threshold: 0,
                        sensitivity: 0,

                    },
                }
            },
            elements: {
                line: {
                    tension: 0
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: "white"
                    },
                    title: {
                        display: true,
                        text: i18n[options.language].chartScore,
                        color: "white"
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: i18n[options.language].chartTime,
                        color: "white"
                    },
                    ticks: {
                        color: "white"
                    },
                    type: "time",
                    time: {
                        unit: "day",
                        format: "timeFormat",
                    },
                    adapters: {
                        date: {
                            locale: "en",
                            zone: "UTC+9"
                        }
                    },
                }
            }
        }
    };
};


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
