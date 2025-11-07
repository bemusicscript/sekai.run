const state = {
    language: '',
    turnstile: {
        login: { token: null },
        register: { token: null },
    }
};

const i18n = {
    en: {
        username: 'Username',
        password: 'Password',
        login: 'Sign In',
        register: 'Sign Up',
        inviteCode: 'Invite Code',
        prosekaUID: 'Friend Code',
        msgSignIn: 'Already have an account?',
        msgSignUp: "Don't have an account?",
        disclaimer: 'No ownership is claimed over the content displayed.<br>This service is not affiliated with SEGA, Colorful Palette, or Crypton in any way.',
        errorValidation: 'Please enter your information correctly.',
        errorDead: 'Service unavailable. Please contact administrator!',
        errorUnknown: 'Unknown Error. Please try again later.',
        errorSuccess: 'Login Successful.',
        errorFailed: 'Incorrect username or password.',
        errorPending: 'Your account is pending approval.',
        errorRejected: 'Account has been rejected.',
        errorInvite: 'Incorrect Invite Code',
        errorReason: 'Reason',
        errorNotice: 'Notice',
        errorDuplicate: 'You already have an account.',
        errorSuccessRegister: 'Signup Successful. Wait for approval.',
        errorBanned: 'You\'ve been permanently banned.',
        errorCaptcha: 'Please complete the captcha verification.',
        userPending: 'pending ',
        userRejected: 'rejected &middot;&nbsp; banned ',
        userCurrent: 'accepted ',
        userSuffix: ' users',
    },
    ja: {
        username: 'アカウント名',
        password: 'パスワード',
        login: 'ログイン',
        register: '新規登録',
        inviteCode: '招待コード',
        prosekaUID: 'プレイヤーID',
        msgSignIn: 'アカウントをお持ちの方は',
        msgSignUp: 'アカウントが未登録ですか？',
        errorValidation: 'ID・パスワードを正しく入力してください。',
        disclaimer: '当サービスに掲載されている内容について所有権を主張するものではありません。<br>当サービスは SEGA・Colorful Palette・Crypton とは一切関係ありません。',
        errorDead: 'サービスを利用できません。<br>管理者にお問い合わせください。',
        errorUnknown: 'エラーが発生しました。<br>もう一度お試しください。',
        errorSuccess: 'ログイン成功',
        errorFailed: 'IDまたはパスワードが正しくありません。',
        errorPending: 'アカウントは未承認状態です。<br>承認されるまでしばらくお待ちください。',
        errorRejected: 'アカウントの登録が拒否されました。',
        errorInvite: '招待コードが間違っています。',
        errorReason: '原因',
        errorNotice: '案内',
        errorDuplicate: 'アカウントがすでに登録されています。',
        errorSuccessRegister: 'アカウントが登録されました。<br>承認されるまでしばらくお待ちください。',
        errorBanned: 'アカウントは永久的に停止されました。',
        errorCaptcha: 'キャプチャを完了してから、もう一度お試しください。',
        userPending: '待機 ',
        userRejected: '拒否 &middot;&nbsp; BAN ',
        userCurrent: '承認 ',
        userSuffix: '名',
    },
    ko: {
        username: '아이디',
        password: '비밀번호',
        login: '로그인',
        register: '회원가입',
        inviteCode: '초대코드',
        prosekaUID: '프로세카 친구코드',
        msgSignIn: '이미 계정이 있으신가요?',
        msgSignUp: '아직 계정이 없으신가요?',
        disclaimer: '본 서비스에 게시된 내용에 대해 소유권을 주장하지 않습니다.<br>본 서비스는 SEGA&nbsp;・&nbsp;Colorful Palette&nbsp;・&nbsp;Crypton과 일절 관계가 없습니다.',
        errorValidation: '계정 정보가 제대로 입력되지 않았습니다.',
        errorDead: '에러가 발생했습니다. 호출벨에 문의하세요.',
        errorUnknown: '에러가 발생했습니다. 나중에 다시 시도하세요.',
        errorFailed: '아이디 혹은 비밀번호가 틀립니다.',
        errorPending: '계정이 미승인 상태입니다. 잠시만 기다려주세요.',
        errorRejected: '계정 승인이 취소되었습니다.',
        errorInvite: '초대코드가 일치하지 않습니다.',
        errorReason: '사유',
        errorNotice: '알림',
        errorDuplicate: '이미 계정이 존재합니다.',
        errorSuccess: '로그인에 성공했습니다.',
        errorSuccessRegister: '회원가입이 완료되었습니다. <br>승인이 끝날 때까지 기다려주세요.',
        errorBanned: '이용규정 위반으로 계정이 영구 차단되었습니다.',
        errorCaptcha: '캡챠 완료 후 다시 시도하세요.',
        userPending: '대기 ',
        userRejected: '거부 &middot; 차단 ',
        userCurrent: '승인 ',
        userSuffix: '명',
    }
};

const passwordHandlers = {
    "#toggleLoginPassword": "floatingLoginPassword",
    "#toggleSignUpPassword": "floatingRegisterPassword",
};

const t = (key) => i18n[state.language]?.[key] ?? key;

const showAlert = (id, variant, html) => {
    const el = $(id);
    el.removeClass('d-none alert-success alert-danger alert-info').addClass(`alert-${variant}`);
    el.html(html);
};

const hideAlert = (id) => $(id).addClass('d-none');

const normalizeLocale = (raw) => {
    const lang = (raw || '').toLowerCase();
    if (lang.startsWith('ko')) return 'ko';
    if (lang.startsWith('ja')) return 'ja';
    return 'en';
};

const renderLanguage = () => {
    $("#disclaimer").html(t("disclaimer"));
    $("#btnLogin, #linkLogin").text(t("login"));
    $("#btnRegister, #linkRegister").text(t("register"));
    $("#msgSignIn").text(t("msgSignIn"));
    $("#msgSignUp").text(t("msgSignUp"));
    $("label[for='floatingLoginUsername'], label[for='floatingRegisterUsername']").text(t("username"));
    $("label[for='floatingLoginPassword'], label[for='floatingRegisterPassword']").text(t("password"));
    $("label[for='floatingInviteCode']").text(t("inviteCode"));
    $("label[for='floatingFriendCode']").text(t("prosekaUID"));
};

const toggleSignUp = () => {
    if($("#registerTurnstile").css("display") == "none"){
        $("#registerTurnstile").css("display", "block");
    }
    $('#signupForm').toggleClass('d-none');
    $('#loginForm').toggleClass('d-none');
};

const postAction = (payload) =>
    $.post('/', payload).then((res) => res).catch(() => 'service_dead');

/* on server-side argon2id is used to validate hashed passwords */
const hashPassword = (password) =>
    sha512(`!!sekai.run${password}sekai.run!!`);

const register = async () => {
    const username = $("#floatingRegisterUsername").val()?.trim();
    const password = hashPassword($("#floatingRegisterPassword").val() || '');
    const inviteCode = $("#floatingInviteCode").val()?.trim();
    const friendCode = $("#floatingFriendCode").val()?.trim();

    if (!state.turnstile.register.token) {
        showAlert('#signUpError', 'danger', t("errorCaptcha"));
        return;
    }

    const code = await postAction({
        action: 'register',
        username,
        password,
        inviteCode,
        friendCode,
        'cf-turnstile-response': state.turnstile.register.token,
    });

    let success = false;
    let codeResult = code.split("||");
    switch(codeResult[0]){
        case "service_dead":
            showAlert("#signUpError", "danger", t("errorDead"));
            break;

        case "validation_error":
            showAlert("#signUpError", "danger", t("errorValidation"));
            break;

        case "incorrect_invite":
            showAlert("#signUpError", "danger", t("errorInvite"));
            break;

        case "duplicate_account":
            showAlert("#signUpError", "danger", t("errorDuplicate"));
            break;

        case "banned":
            showAlert("#signUpError", "danger", t("errorBanned"));
            break;

        case "captcha":
            showAlert("#signUpError", "danger", t("errorCaptcha"));
            break;

        case "done":
            hideAlert("#signUpError");
            showAlert("#loginError", "success", t("errorSuccessRegister"));
            toggleSignUp();
            success = true;
            break;

        default:
            showAlert("#signUpError", "danger", t("errorUnknown"));
            break;
    }
    if(!success) turnstile.reset("#cfRegister");
};

const login = async () => {
    const username = $("#floatingLoginUsername").val()?.trim();
    const password = hashPassword($("#floatingLoginPassword").val() || '');

    if (!state.turnstile.login.token) {
        showAlert('#loginError', 'danger', t("errorCaptcha"));
        return;
    }

    const code = await postAction({
        action: 'login',
        username,
        password,
        'cf-turnstile-response': state.turnstile.login.token,
    });
    let codeResult = code.split("||");

    let success = false;
    switch(codeResult[0]){
        case "service_dead":
            showAlert("#loginError", "danger", t("errorDead"));
            break;

        case "validation_error":
            showAlert("#loginError", "danger", t("errorValidation"));
            break;

        case "incorrect_account":
            showAlert("#loginError", "danger", t("errorFailed"));
            break;

        case "awaiting":
            if(codeResult[1]){
                showAlert("#loginError", "info", `${t("errorPending")}<br>(${t("errorNotice")}: ${codeResult[1] ?? "?"})`);
            }else{
                showAlert("#loginError", "info", `${t("errorPending")}`);
            }
            break;

        case "rejected":
            showAlert("#loginError", "danger", `${t("errorRejected")}<br>(${t("errorReason")}: ${codeResult[1] ?? "?"})`);
            break;

        case "banned":
            showAlert("#loginError", "danger", `${t("errorBanned")}<br>(${t("errorReason")}: ${codeResult[1] ?? "?"})`);
            break;

        case "captcha":
            showAlert("#loginError", "danger", t("errorCaptcha"));
            break;

        case "done":
            showAlert("#loginError", "success", t("errorSuccess"));
            location.reload();
            success = true;
            break;

        default:
            showAlert("#loginError", "danger", t("errorUnknown"));
            break;
    }
    if(!success) turnstile.reset("#cfLogin");

};

const getStatistics = async () => {
    const r = await fetch('/statistics/users').then((x) => x.json()).catch();
    if (!r) return;
    if (r.count_normal == undefined) return;
    $('#statistics').html(
        `${t('userCurrent')}<b>${r.count_normal}${t('userSuffix')}</b><br>` +
        `${t('userPending')}<b>${r.count_queue}${t('userSuffix')}</b><br>` +
        `${t('userRejected')}<b>${r.count_rejected}${t('userSuffix')}</b>`
    );
};

/* statistics and i18n */
const init = async () => {
    if (!state.language) {
        const langOriginal = JSON.parse(localStorage.getItem("options") || "{}")?.language;
        const langBrowser = navigator.language || navigator.userLanguage || "en";
        state.language = normalizeLocale(langOriginal || langBrowser);
    }
    getStatistics();
    await renderLanguage();
};

/* password toggling */
Object.entries(passwordHandlers).forEach(([btnSel, inputId]) => {
    const btn = document.querySelector(btnSel);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener("click", (e) => {
        input.type = input.type === "password" ? "text" : "password";
        const icon = e.target.closest(".bi-eye, .bi-eye-slash") || e.target;
        icon.classList.toggle("bi-eye");
        icon.classList.toggle("bi-eye-slash");
    });
});

/* cf turnstile */
window.onTurnstileLogin = (token) => {
    state.turnstile.login.token = token;
    $('#btnLogin').prop('disabled', false);
};

window.onTurnstileRegister = (token) => {
    state.turnstile.register.token = token;
    $('#btnRegister').prop('disabled', false);
};

window.onTurnstileLoginExpired = () => {
    state.turnstile.login.token = null;
    $('#btnLogin').prop('disabled', true);
    turnstile.reset('#cfLogin');
};

window.onTurnstileRegisterExpired = () => {
    state.turnstile.register.token = null;
    $('#btnRegister').prop('disabled', true);
    turnstile.reset('#cfRegister');
};

/* ensure friend code is numeric */
document.querySelector("#floatingFriendCode").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
});

init();
setInterval(getStatistics, 1000 * 60);
