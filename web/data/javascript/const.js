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
