(() => {
  const { t, categoryLabel } = window.i18n;
  // The game runs in a Netlify Function (netlify/functions/game.mjs). Every
  // phone polls it about once a second to stay in sync.
  const API_URL = '/api/game';
  // Public address used in invite links (local testing keeps its own address).
  const SITE_URL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? location.origin : 'https://letterblitz.world';
  const POLL_FAST_MS = 1000;
  const POLL_SLOW_MS = 1500;

  const LS_NAME = 'lb_name';
  const LS_CODE = 'lb_code';
  const LS_PLAYER_ID = 'lb_player_id';
  const LS_AVATAR = 'lb_avatar';

  const els = {
    views: {
      landing: document.getElementById('view-landing'),
      lobby: document.getElementById('view-lobby'),
      playing: document.getElementById('view-playing'),
      reveal: document.getElementById('view-reveal'),
      scores: document.getElementById('view-scores'),
      closed: document.getElementById('view-closed'),
      admin: document.getElementById('view-admin'),
      adminList: document.getElementById('view-admin-list'),
      adminSponsor: document.getElementById('view-admin-sponsor'),
    },
    nameInput: document.getElementById('name-input'),
    avatarGrid: document.getElementById('avatar-grid'),
    avatarDots: document.getElementById('avatar-dots'),
    avatarPrev: document.getElementById('avatar-prev'),
    avatarNext: document.getElementById('avatar-next'),
    avatarHint: document.getElementById('avatar-hint'),
    inviteBanner: document.getElementById('invite-banner'),
    btnInvite: document.getElementById('btn-invite'),
    tabJoin: document.getElementById('tab-join'),
    tabCreate: document.getElementById('tab-create'),
    panelJoin: document.getElementById('panel-join'),
    panelCreate: document.getElementById('panel-create'),
    codeInput: document.getElementById('code-input'),
    btnJoin: document.getElementById('btn-join'),
    btnCreate: document.getElementById('btn-create'),
    durationInput: document.getElementById('duration-input'),
    durationOut: document.getElementById('duration-out'),
    catcountInput: document.getElementById('catcount-input'),
    catcountOut: document.getElementById('catcount-out'),
    landingError: document.getElementById('landing-error'),

    lobbyCode: document.getElementById('lobby-code'),
    lobbySponsor: document.getElementById('lobby-sponsor'),
    prizeCard: document.getElementById('prize-card'),
    lobbyPlayers: document.getElementById('lobby-players'),
    btnStart: document.getElementById('btn-start'),
    lobbyWaitNote: document.getElementById('lobby-wait-note'),
    btnLeaveLobby: document.getElementById('btn-leave-lobby'),

    playingCode: document.getElementById('playing-code'),
    timerText: document.getElementById('timer-text'),
    timerFill: document.getElementById('timer-fill'),
    roundLetter: document.getElementById('round-letter'),
    progressRow: document.getElementById('progress-row'),
    categoryList: document.getElementById('category-list'),

    revealCode: document.getElementById('reveal-code'),
    btnLeaveReveal: document.getElementById('btn-leave-reveal'),
    btnShowScores: document.getElementById('btn-show-scores'),
    roundChoice: document.getElementById('round-choice'),
    gameTypeField: document.getElementById('game-type-field'),
    sponsorPick: document.getElementById('sponsor-pick'),
    sponsorOptions: document.getElementById('sponsor-options'),
    lobbySettings: document.getElementById('lobby-settings'),
    roundCounter: document.getElementById('round-counter'),
    btnPlayAgain: document.getElementById('btn-play-again'),

    scoresCode: document.getElementById('scores-code'),
    scoresRound: document.getElementById('scores-round'),
    scoresWinner: document.getElementById('scores-winner'),
    btnLeaveScores: document.getElementById('btn-leave-scores'),
    btnShowAnswers: document.getElementById('btn-show-answers'),

    adminModal: document.getElementById('admin-modal'),
    adminForm: document.getElementById('admin-form'),
    adminPassword: document.getElementById('admin-password'),
    adminPasscode: document.getElementById('admin-passcode'),
    adminError: document.getElementById('admin-error'),
    btnAdminCancel: document.getElementById('btn-admin-cancel'),
    btnAdminSubmit: document.getElementById('btn-admin-submit'),
    btnAdminRefresh: document.getElementById('btn-admin-refresh'),
    btnAdminLogout: document.getElementById('btn-admin-logout'),
    adminUpdated: document.getElementById('admin-updated'),
    adminTiles: document.getElementById('admin-tiles'),
    adminRooms: document.getElementById('admin-rooms'),
    adminRoomsCount: document.getElementById('admin-rooms-count'),
    adminDays: document.getElementById('admin-days'),
    adminStorage: document.getElementById('admin-storage'),
    adminFeedback: document.getElementById('admin-feedback'),
    adminFeedbackCount: document.getElementById('admin-feedback-count'),
    adminFeedbackSummary: document.getElementById('admin-feedback-summary'),
    adminMessages: document.getElementById('admin-messages'),
    adminMessagesCount: document.getElementById('admin-messages-count'),
    btnViewFeedback: document.getElementById('btn-view-feedback'),
    btnViewMessages: document.getElementById('btn-view-messages'),
    btnListBack: document.getElementById('btn-list-back'),
    adminSponsors: document.getElementById('admin-sponsors'),
    adminSponsorsCount: document.getElementById('admin-sponsors-count'),
    btnNewCampaign: document.getElementById('btn-new-campaign'),
    btnSponsorBack: document.getElementById('btn-sponsor-back'),
    sponsorFormTitle: document.getElementById('sponsor-form-title'),
    sponsorForm: document.getElementById('sponsor-form'),
    sfError: document.getElementById('sf-error'),
    sfLogo: document.getElementById('sf-logo'),
    sfLogoPreview: document.getElementById('sf-logo-preview'),
    sfLogoRemove: document.getElementById('sf-logo-remove'),
    sfCodesInfo: document.getElementById('sf-codes-info'),
    sfCats: document.getElementById('sf-cats'),
    listTitle: document.getElementById('list-title'),
    listCount: document.getElementById('list-count'),
    listSummary: document.getElementById('list-summary'),
    starFilter: document.getElementById('star-filter'),
    btnListCsv: document.getElementById('btn-list-csv'),
    listItems: document.getElementById('list-items'),

    feedbackModal: document.getElementById('feedback-modal'),
    feedbackForm: document.getElementById('feedback-form'),
    feedbackArt: document.getElementById('feedback-art'),
    ratingLabel: document.getElementById('rating-label'),
    feedbackComment: document.getElementById('feedback-comment'),
    feedbackError: document.getElementById('feedback-error'),
    btnFeedbackSkip: document.getElementById('btn-feedback-skip'),
    btnFeedbackSend: document.getElementById('btn-feedback-send'),
    adminDeleteForm: document.getElementById('admin-delete-form'),
    adminDeleteWhat: document.getElementById('admin-delete-what'),
    adminDeleteBefore: document.getElementById('admin-delete-before'),

    closedTitle: document.getElementById('closed-title'),
    closedText: document.getElementById('closed-text'),
    btnClosedCreate: document.getElementById('btn-closed-create'),
    btnClosedJoin: document.getElementById('btn-closed-join'),

    playBar: document.getElementById('play-bar'),
    playersPill: document.getElementById('players-pill'),
    playersCount: document.getElementById('players-count'),
    playersPanel: document.getElementById('players-panel'),
    playersPanelTitle: document.getElementById('players-panel-title'),
    playersPanelHint: document.getElementById('players-panel-hint'),
    playersPanelList: document.getElementById('players-panel-list'),
    showPlayersRow: document.getElementById('show-players-row'),
    showPlayersSwitch: document.getElementById('show-players-switch'),
    barLetter: document.getElementById('bar-letter'),

    leaveModal: document.getElementById('leave-modal'),
    leaveTitle: document.getElementById('leave-title'),
    leaveDesc: document.getElementById('leave-desc'),
    leaveActions: document.getElementById('leave-actions'),
    hostLeave: document.getElementById('host-leave'),
    crownList: document.getElementById('crown-list'),
    btnGiveCrown: document.getElementById('btn-give-crown'),
    btnCloseRoom: document.getElementById('btn-close-room'),
    btnHostStay: document.getElementById('btn-host-stay'),
    btnLeaveCancel: document.getElementById('btn-leave-cancel'),
    btnLeaveConfirm: document.getElementById('btn-leave-confirm'),
    revealBanner: document.getElementById('reveal-banner'),
    revealCategories: document.getElementById('reveal-categories'),
    leaderboardList: document.getElementById('leaderboard-list'),
    letterPicker: document.getElementById('letter-picker'),
    letterGrid: document.getElementById('letter-grid'),
    revealWaitNote: document.getElementById('reveal-wait-note'),

    toast: document.getElementById('toast'),
  };

  let myPlayerId = localStorage.getItem(LS_PLAYER_ID) || null;
  let myRoomCode = localStorage.getItem(LS_CODE) || null;
  let myAvatar = localStorage.getItem(LS_AVATAR) || null;
  // Invite links look like https://…/?room=ABCD
  const inviteCode = (new URLSearchParams(location.search).get('room') || '').trim().toUpperCase();
  const invitedTo = /^[A-Z0-9]{4}$/.test(inviteCode) ? inviteCode : null;
  let currentState = null;
  let timerRAF = null;
  let renderedRound = 0;
  let clockOffset = 0; // server time - local time
  let pollTimer = null;
  let answerTimer = null;
  let answersDirty = false;
  let finalSentRound = 0;
  // After a round: 'answers' first, then the separate 'scores' screen.
  let revealScreen = 'answers';
  let selectedRounds = 5;
  let revealRound = 0;
  const answerInputs = new Map(); // catId -> input element

  function serverNow() {
    return Date.now() + clockOffset;
  }

  async function api(action, payload = {}) {
    const sentAt = Date.now();
    let res;
    let data;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, code: myRoomCode, playerId: myPlayerId, ...payload }),
      });
      data = await res.json();
    } catch {
      throw new Error(t('cantReach'));
    }
    if (typeof data.now === 'number') {
      clockOffset = data.now - (sentAt + Date.now()) / 2;
    }
    if (!res.ok) {
      const code = data.errorCode;
      const err = new Error(code ? t(`err_${code}`) : t('somethingWrong'));
      err.code = code;
      err.serverMessage = data.error;
      err.fatal = code === 'room_not_found' || code === 'not_in_room' || code === 'room_closed';
      throw err;
    }
    if (data.playerId) {
      myPlayerId = data.playerId;
      localStorage.setItem(LS_PLAYER_ID, myPlayerId);
    }
    if (data.state) {
      myRoomCode = data.state.code;
      localStorage.setItem(LS_CODE, myRoomCode);
      announceJoins(data.state);
      const prevPhase = currentState && currentState.phase;
      currentState = data.state;
      render(data.state, prevPhase);
    }
    return data;
  }

  // "Bob joined the room" for players who weren't in the last update.
  let knownRoom = null;
  let knownIds = null;
  function announceJoins(state) {
    const ids = new Set(state.players.map((p) => p.id));
    if (knownRoom === state.code && knownIds) {
      const newcomers = state.players.filter((p) => !knownIds.has(p.id) && p.id !== myPlayerId);
      if (newcomers.length === 1) {
        showToast(t('playerJoined', { name: newcomers[0].name }), newcomers[0].avatar);
      } else if (newcomers.length > 1) {
        showToast(t('playersJoined', { names: newcomers.map((p) => p.name).join(t('and')) }), newcomers[0].avatar);
      }
    }
    knownRoom = state.code;
    knownIds = ids;
  }

  function showError(message) {
    if (!els.views.landing.hidden) {
      els.landingError.textContent = message;
      els.landingError.hidden = false;
    } else {
      showToast(message);
    }
  }

  function schedulePoll() {
    clearTimeout(pollTimer);
    if (!myRoomCode || !myPlayerId) return;
    const phase = currentState && currentState.phase;
    const delay = phase === 'playing' || phase === 'checking' ? POLL_FAST_MS : POLL_SLOW_MS;
    pollTimer = setTimeout(poll, delay);
  }

  async function poll() {
    try {
      await api('poll');
    } catch (err) {
      if (err.code === 'room_closed') {
        showRoomClosed('closed', myRoomCode);
        return;
      }
      if (err.fatal) {
        resetToLanding(err.message);
        return;
      }
    }
    schedulePoll();
  }

  function collectAnswers() {
    const answers = {};
    for (const [catId, input] of answerInputs) answers[catId] = input.value;
    return answers;
  }

  async function sendAnswers() {
    clearTimeout(answerTimer);
    if (!answersDirty || !currentState) return;
    answersDirty = false;
    try {
      await api('answers', { round: currentState.round, answers: collectAnswers() });
    } catch {
      answersDirty = true;
    }
  }

  function queueAnswerSync() {
    answersDirty = true;
    clearTimeout(answerTimer);
    answerTimer = setTimeout(sendAnswers, 600);
  }

  // Put an icon (public/icons.js) before a line of text.
  function setIconText(el, iconName, text) {
    el.innerHTML = `${iconName ? icon(iconName) : ''}<span></span>`;
    el.querySelector('span').textContent = text;
  }

  // Optional avatar id shows that player's avatar next to the message.
  function showToast(message, avatarId) {
    els.toast.innerHTML = `${avatarId ? avatarHTML(avatarId) : ''}<span></span>`;
    els.toast.querySelector('span:last-child').textContent = message;
    els.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { els.toast.hidden = true; }, 3200);
  }

  function showView(name) {
    for (const [key, el] of Object.entries(els.views)) {
      el.hidden = key !== name;
    }
    // The avatar pages can only be positioned once the start screen is visible.
    if (name === 'landing') requestAnimationFrame(showSelectedAvatarPage);
  }

  // ---------------- landing ----------------

  els.nameInput.value = localStorage.getItem(LS_NAME) || '';

  els.tabJoin.addEventListener('click', () => setTab('join'));
  els.tabCreate.addEventListener('click', () => {
    setTab('create');
    loadAvailableSponsors(); // refresh the list of sponsors running right now
  });

  function setTab(which) {
    const isJoin = which === 'join';
    els.tabJoin.classList.toggle('is-active', isJoin);
    els.tabCreate.classList.toggle('is-active', !isJoin);
    els.tabJoin.setAttribute('aria-selected', String(isJoin));
    els.tabCreate.setAttribute('aria-selected', String(!isJoin));
    els.panelJoin.hidden = !isJoin;
    els.panelCreate.hidden = isJoin;
  }

  els.durationInput.addEventListener('input', () => {
    els.durationOut.textContent = els.durationInput.value;
  });
  els.catcountInput.addEventListener('input', () => {
    els.catcountOut.textContent = els.catcountInput.value;
  });

  function landingName() {
    const name = els.nameInput.value.trim();
    if (!name) {
      els.landingError.textContent = t('enterName');
      els.landingError.hidden = false;
      return null;
    }
    if (!myAvatar) {
      els.landingError.textContent = t('pickAvatar');
      els.landingError.hidden = false;
      els.avatarGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return null;
    }
    els.landingError.hidden = true;
    localStorage.setItem(LS_NAME, name);
    return name;
  }

  els.btnJoin.addEventListener('click', () => {
    const name = landingName();
    if (!name) return;
    const code = els.codeInput.value.trim().toUpperCase();
    if (code.length !== 4) {
      els.landingError.textContent = t('codeFormat');
      els.landingError.hidden = false;
      return;
    }
    myRoomCode = code;
    enterRoom('join', { code, name, avatar: myAvatar });
  });

  els.btnCreate.addEventListener('click', () => {
    const name = landingName();
    if (!name) return;
    const prizeGame = gameType === 'prizes' && availableSponsors.length > 0;
    if (prizeGame && !chosenSponsor) {
      els.landingError.textContent = t('pickSponsorFirst');
      els.landingError.hidden = false;
      return;
    }
    myRoomCode = null;
    enterRoom('create', {
      name,
      avatar: myAvatar,
      settings: {
        totalRounds: selectedRounds,
        duration: Number(els.durationInput.value) * 1000,
        categoriesPerRound: Number(els.catcountInput.value),
        sponsorId: prizeGame ? chosenSponsor : undefined,
      },
    });
  });

  // ---------------- game type: just for fun / real prizes ----------------

  // "Real prizes" only appears when the admin has a sponsor campaign running.
  let availableSponsors = [];
  let gameType = 'fun';
  let chosenSponsor = null;

  async function loadAvailableSponsors() {
    try {
      const data = await api('sponsorsAvailable');
      availableSponsors = data.sponsors || [];
      for (const sp of availableSponsors) sponsorCache.set(sp.id, sp);
    } catch {
      availableSponsors = [];
    }
    if (!availableSponsors.some((sp) => sp.id === chosenSponsor)) chosenSponsor = null;
    if (availableSponsors.length === 1) chosenSponsor = availableSponsors[0].id;
    if (!availableSponsors.length) gameType = 'fun';
    renderGameType();
  }

  function renderGameType() {
    const any = availableSponsors.length > 0;
    els.gameTypeField.hidden = !any;
    for (const btn of els.gameTypeField.querySelectorAll('[data-game-type]')) {
      btn.setAttribute('aria-checked', String(btn.dataset.gameType === gameType));
    }
    const prizes = any && gameType === 'prizes';
    els.sponsorPick.hidden = !prizes;
    els.sponsorOptions.innerHTML = '';
    for (const sp of availableSponsors) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sponsor-option';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(sp.id === chosenSponsor));
      btn.style.setProperty('--sponsor-color', sp.color);
      btn.appendChild(sponsorLogo(sp));
      const text = document.createElement('span');
      text.className = 'sponsor-option-text';
      text.innerHTML = '<span class="sponsor-option-name"></span><span class="sponsor-option-prize"></span><span class="sponsor-option-need"></span>';
      text.querySelector('.sponsor-option-name').textContent = sp.name;
      text.querySelector('.sponsor-option-prize').textContent = t('winnerGets', { prize: sText(sp.prize) });
      text.querySelector('.sponsor-option-need').textContent = t('sponsorNeeds', { players: sp.minPlayers, rounds: sp.minRounds });
      btn.appendChild(text);
      btn.addEventListener('click', () => {
        chosenSponsor = sp.id;
        if (!els.landingError.hidden) els.landingError.hidden = true;
        renderGameType();
      });
      els.sponsorOptions.appendChild(btn);
    }
    // A prize game must be long enough to count: hide round counts below the minimum.
    const sp = prizes && availableSponsors.find((x) => x.id === chosenSponsor);
    const minRounds = sp ? sp.minRounds : 1;
    for (const btn of els.roundChoice.querySelectorAll('[data-rounds]')) {
      btn.disabled = Number(btn.dataset.rounds) < minRounds;
    }
    if (selectedRounds < minRounds) selectRounds(minRounds);
  }

  for (const btn of els.gameTypeField.querySelectorAll('[data-game-type]')) {
    btn.addEventListener('click', () => {
      gameType = btn.dataset.gameType;
      if (!els.landingError.hidden) els.landingError.hidden = true;
      renderGameType();
    });
  }

  async function enterRoom(action, payload) {
    els.btnJoin.disabled = true;
    els.btnCreate.disabled = true;
    try {
      await api(action, payload);
      // Drop ?room=… from the address bar once inside a room.
      if (invitedTo) history.replaceState(null, '', location.pathname);
      els.inviteBanner.hidden = true;
      schedulePoll();
    } catch (err) {
      const code = payload.code || invitedTo;
      if (err.code === 'admin_login') openAdminLogin();
      else if (err.code === 'sponsor_unavailable') {
        showError(err.message);
        loadAvailableSponsors();
      }
      else if (err.code === 'room_closed') showRoomClosed('closed', code);
      else if (err.code === 'room_not_found' && invitedTo && code === invitedTo) showRoomClosed('gone', code);
      else showError(err.message);
    } finally {
      els.btnJoin.disabled = false;
      els.btnCreate.disabled = false;
    }
  }

  // ---------------- feedback ----------------

  // Asked once per room: after the last round, or when leaving.
  const FEEDBACK_KEY = 'lb_feedback_rooms';
  function feedbackGiven(code) {
    try {
      return !!code && JSON.parse(sessionStorage.getItem(FEEDBACK_KEY) || '[]').includes(code);
    } catch {
      return false;
    }
  }
  function markFeedback(code) {
    if (!code) return;
    try {
      const list = JSON.parse(sessionStorage.getItem(FEEDBACK_KEY) || '[]');
      sessionStorage.setItem(FEEDBACK_KEY, JSON.stringify([...list, code].slice(-50)));
    } catch {}
  }

  let feedbackCtx = null; // { context, name, avatar, code }
  let feedbackRating = 0;

  function setRating(n) {
    feedbackRating = n;
    for (const btn of els.feedbackForm.querySelectorAll('.rating-star')) {
      const v = Number(btn.dataset.rating);
      btn.classList.toggle('is-on', v <= n);
      btn.setAttribute('aria-checked', String(v === n));
      btn.setAttribute('aria-label', `${v} / 5 — ${t(`rating${v}`)}`);
    }
    els.ratingLabel.textContent = n ? t(`rating${n}`) : '\u00a0';
    els.btnFeedbackSend.disabled = !n;
  }
  for (const btn of els.feedbackForm.querySelectorAll('.rating-star')) {
    btn.addEventListener('click', () => setRating(Number(btn.dataset.rating)));
  }

  function openFeedback(context, who) {
    if (!els.feedbackModal.hidden || !els.leaveModal.hidden) return;
    feedbackCtx = { context, ...who };
    markFeedback(who.code); // never ask twice for the same game, even if skipped
    setRating(0);
    els.feedbackComment.value = '';
    els.feedbackError.hidden = true;
    els.feedbackArt.innerHTML = who.avatar ? avatarHTML(who.avatar, who.name) : icon('star');
    els.feedbackModal.hidden = false;
  }
  function closeFeedback() {
    els.feedbackModal.hidden = true;
    feedbackCtx = null;
  }
  els.btnFeedbackSkip.addEventListener('click', closeFeedback);
  els.feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!feedbackRating || !feedbackCtx) return;
    els.btnFeedbackSend.disabled = true;
    try {
      await api('feedback', {
        rating: feedbackRating,
        comment: els.feedbackComment.value,
        context: feedbackCtx.context,
        name: feedbackCtx.name,
        avatar: feedbackCtx.avatar,
        code: feedbackCtx.code,
        lang: window.i18n.lang,
      });
      const avatar = feedbackCtx.avatar;
      closeFeedback();
      showToast(t('feedbackThanks'), avatar);
    } catch (err) {
      els.feedbackError.textContent = err.message;
      els.feedbackError.hidden = false;
      els.btnFeedbackSend.disabled = false;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.feedbackModal.hidden) closeFeedback();
  });

  // ---------------- admin ----------------

  const SS_ADMIN = 'lb_admin_token';
  let adminTimer = null;
  let lastDashboard = null;
  const ssGet = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
  const ssSet = (k, v) => { try { v === null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch {} };

  function openAdminLogin() {
    els.adminError.hidden = true;
    els.adminPassword.value = '';
    els.adminPasscode.value = '';
    els.adminModal.hidden = false;
    els.adminPassword.focus();
  }
  function closeAdminLogin() {
    els.adminModal.hidden = true;
  }
  els.btnAdminCancel.addEventListener('click', closeAdminLogin);
  els.adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.btnAdminSubmit.disabled = true;
    try {
      const data = await api('adminLogin', { password: els.adminPassword.value, passcode: els.adminPasscode.value });
      ssSet(SS_ADMIN, data.adminToken);
      closeAdminLogin();
      els.nameInput.value = localStorage.getItem(LS_NAME) || '';
      showAdmin();
    } catch (err) {
      els.adminError.textContent = err.message;
      els.adminError.hidden = false;
      els.adminPasscode.value = '';
    } finally {
      els.btnAdminSubmit.disabled = false;
    }
  });

  function showAdmin() {
    showView('admin');
    window.scrollTo(0, 0);
    loadDashboard();
  }

  async function loadDashboard() {
    clearTimeout(adminTimer);
    try {
      const [data, sponsorsData] = await Promise.all([
        api('adminStats', { token: ssGet(SS_ADMIN) }),
        api('adminSponsors', { token: ssGet(SS_ADMIN) }),
      ]);
      lastDashboard = data.dashboard;
      lastCampaigns = sponsorsData.campaigns || [];
      renderDashboard();
    } catch (err) {
      if (err.code === 'admin_expired') {
        adminSignOut(err.message);
        return;
      }
      showToast(err.message);
    }
    if (!els.views.admin.hidden || !els.views.adminList.hidden) adminTimer = setTimeout(loadDashboard, 10000);
  }

  function adminSignOut(message) {
    clearTimeout(adminTimer);
    ssSet(SS_ADMIN, null);
    lastDashboard = null;
    listMode = null;
    showView('landing');
    if (message) showError(message);
  }
  els.btnAdminRefresh.addEventListener('click', loadDashboard);

  // CSV downloads (built on the server, saved by the browser).
  async function downloadCsv(dataset, btn, extra = {}) {
    btn.disabled = true;
    try {
      const data = await api('adminCsv', { token: ssGet(SS_ADMIN), dataset, ...extra });
      const url = URL.createObjectURL(new Blob([data.csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(t('csvReady', { file: data.filename }));
    } catch (err) {
      if (err.code === 'admin_expired') adminSignOut(err.message);
      else showToast(err.message);
    } finally {
      btn.disabled = false;
    }
  }
  for (const btn of document.querySelectorAll('[data-csv]')) {
    btn.addEventListener('click', () => downloadCsv(btn.dataset.csv, btn));
  }

  // Manual deletion — the only way admin data is ever removed.
  els.adminDeleteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dataset = els.adminDeleteWhat.value;
    const before = els.adminDeleteBefore.value;
    const what = els.adminDeleteWhat.selectedOptions[0].textContent;
    const question = before ? t('confirmDeleteBefore', { what, date: before }) : t('confirmDeleteAll', { what });
    if (!window.confirm(question)) return;
    try {
      const data = await api('adminDelete', { token: ssGet(SS_ADMIN), dataset, before });
      lastDashboard = data.dashboard;
      renderDashboard();
      showToast(t('deletedToast', { n: data.deleted }));
    } catch (err) {
      if (err.code === 'admin_expired') adminSignOut(err.message);
      else showToast(err.message);
    }
  });
  els.btnAdminLogout.addEventListener('click', () => adminSignOut());

  const fmt = (n) => Number(n || 0).toLocaleString(window.i18n.lang === 'fr' ? 'fr-FR' : 'en-US');
  // "12 h 5 min" (or "40 s" for very short totals).
  const hours = (ms) => {
    const totalMin = Math.floor((ms || 0) / 60000);
    if (totalMin < 1) return `${Math.round((ms || 0) / 1000)} s`;
    const h = Math.floor(totalMin / 60);
    return h ? `${fmt(h)} h ${totalMin % 60} min` : `${totalMin} min`;
  };

  const when = (ts) =>
    new Date(ts).toLocaleString(window.i18n.lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });

  function deleteButton(id) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-btn feed-delete';
    btn.textContent = t('deleteItem');
    btn.addEventListener('click', async () => {
      if (!window.confirm(t('confirmDeleteItem'))) return;
      try {
        const data = await api('adminDeleteItem', { token: ssGet(SS_ADMIN), id });
        lastDashboard = data.dashboard;
        renderDashboard();
      } catch (err) {
        if (err.code === 'admin_expired') adminSignOut(err.message);
        else showToast(err.message);
      }
    });
    return btn;
  }

  const INBOX_PREVIEW = 4; // entries shown on the dashboard; "View all" shows the rest

  function feedbackSummary(feedback) {
    if (!feedback.length) return t('noFeedback');
    const by = [0, 0, 0, 0, 0, 0];
    for (const f of feedback) by[f.rating] += 1;
    const avg = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
    return t('avgRating', { avg: avg.toFixed(1), n: fmt(feedback.length), s5: by[5], s4: by[4], s3: by[3], s2: by[2], s1: by[1] });
  }

  function feedbackCard(f) {
    const card = document.createElement('div');
    card.className = 'feed-item';
    card.innerHTML = `<div class="feed-head">${avatarHTML(f.avatar, f.name || '?')}<div class="feed-who"><span class="feed-name"></span><span class="feed-meta"></span></div><div class="feed-stars">${[1, 2, 3, 4, 5]
      .map((v) => `<span class="${v <= f.rating ? '' : 'off'}">${icon('star')}</span>`)
      .join('')}</div></div><p class="feed-text"></p>`;
    card.querySelector('.feed-name').textContent = f.name || t('anonymous');
    card.querySelector('.feed-meta').textContent = [when(f.createdAt), t(`ctx_${f.context}`), f.roomCode, f.lang.toUpperCase()].filter(Boolean).join(' · ');
    const text = card.querySelector('.feed-text');
    text.textContent = f.comment || t('noComment');
    text.classList.toggle('is-empty', !f.comment);
    card.appendChild(deleteButton(f.id));
    return card;
  }

  function messageCard(m) {
    const card = document.createElement('div');
    card.className = 'feed-item';
    card.innerHTML = `<div class="feed-head">${icon('mail')}<div class="feed-who"><span class="feed-name"></span><span class="feed-meta"></span></div></div><p class="feed-text"></p>`;
    card.querySelector('.feed-name').textContent = m.name || t('anonymous');
    card.querySelector('.feed-meta').textContent = `${when(m.createdAt)} · ${m.lang.toUpperCase()}`;
    card.querySelector('.feed-text').textContent = m.message;
    if (m.email) {
      const a = document.createElement('a');
      a.className = 'feed-email';
      a.href = `mailto:${m.email}`;
      a.textContent = m.email;
      card.querySelector('.feed-who').appendChild(a);
    }
    card.appendChild(deleteButton(m.id));
    return card;
  }

  function emptyNote(container, text) {
    const p = document.createElement('p');
    p.className = 'admin-empty';
    p.textContent = text;
    container.appendChild(p);
  }

  // Dashboard: the latest few of each, with "View all".
  function renderInbox(d) {
    const feedback = d.feedback || [];
    const messages = d.messages || [];

    els.adminFeedbackCount.textContent = fmt(feedback.length);
    els.adminFeedbackSummary.textContent = feedbackSummary(feedback);
    els.adminFeedback.innerHTML = '';
    for (const f of feedback.slice(0, INBOX_PREVIEW)) els.adminFeedback.appendChild(feedbackCard(f));
    els.btnViewFeedback.hidden = !feedback.length;
    els.btnViewFeedback.textContent = t('viewAll', { n: fmt(feedback.length) });

    els.adminMessagesCount.textContent = fmt(messages.length);
    els.adminMessages.innerHTML = '';
    if (!messages.length) emptyNote(els.adminMessages, t('noMessages'));
    for (const m of messages.slice(0, INBOX_PREVIEW)) els.adminMessages.appendChild(messageCard(m));
    els.btnViewMessages.hidden = !messages.length;
    els.btnViewMessages.textContent = t('viewAll', { n: fmt(messages.length) });
  }

  // ---- sponsor campaigns ----

  let lastCampaigns = [];
  let editingCampaign = null; // campaign being edited, or null for a new one
  let pendingLogo; // undefined = unchanged, '' = removed, data URL = new logo
  const CHECK_AS = ['anything', 'country', 'capital', 'city', 'man', 'woman', 'singer', 'car', 'actor', 'fruit', 'animal', 'food', 'vegetable', 'athlete', 'movie_tv', 'brand', 'job', 'sport'];

  function campaignStatus(c) {
    const now = Date.now();
    if (!c.active) return 'paused';
    if (now < c.startsAt) return 'scheduled';
    if (now >= c.endsAt) return 'ended';
    return 'live';
  }

  function renderCampaigns() {
    const list = lastCampaigns || [];
    els.adminSponsorsCount.textContent = fmt(list.length);
    els.adminSponsors.innerHTML = '';
    if (!list.length) emptyNote(els.adminSponsors, t('noCampaigns'));
    const dateFmt = (ms) => new Date(ms).toLocaleDateString(window.i18n.lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'medium' });
    for (const c of list) {
      const r = c.report || {};
      const status = campaignStatus(c);
      const card = document.createElement('div');
      card.className = 'feed-item campaign-card';
      card.style.setProperty('--sponsor-color', c.color);
      const head = document.createElement('div');
      head.className = 'feed-head';
      head.appendChild(sponsorLogo(c));
      head.insertAdjacentHTML('beforeend', `<div class="feed-who"><span class="feed-name"></span><span class="feed-meta"></span></div><span class="campaign-status${status === 'live' ? ' is-live' : ''}"></span>`);
      head.querySelector('.feed-name').textContent = c.name;
      head.querySelector('.feed-meta').textContent = `${dateFmt(c.startsAt)} → ${dateFmt(c.endsAt)} · ${sText(c.prize)}`;
      head.querySelector('.campaign-status').textContent = t(`status_${status}`);
      card.appendChild(head);
      const stats = document.createElement('div');
      stats.className = 'campaign-stats';
      for (const [value, label] of [
        [r.rooms, 'cRooms'],
        [r.playersReached, 'cReached'],
        [r.gamesCompleted, 'cGames'],
        [r.prizes, 'cPrizes'],
        [r.codesLeft, 'cCodesLeft'],
        [r.clicks, 'cClicks'],
        [r.answers, 'cAnswers'],
      ]) {
        const div = document.createElement('div');
        div.innerHTML = '<b></b><span></span>';
        div.querySelector('b').textContent = fmt(value);
        div.querySelector('span').textContent = t(label);
        stats.appendChild(div);
      }
      card.appendChild(stats);
      const actions = document.createElement('div');
      actions.className = 'campaign-actions';
      const btn = (label, cls, onClick) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `btn ${cls} btn-sm`;
        b.textContent = label;
        b.addEventListener('click', () => onClick(b));
        actions.appendChild(b);
      };
      btn(t('edit'), 'btn-secondary', () => openCampaignEditor(c));
      btn(t('claimsCsv'), 'btn-secondary', (b) => downloadCsv('claims', b, { campaignId: c.id }));
      if (r.answers) {
        btn(t('answerSummaryCsv'), 'btn-secondary', (b) => downloadCsv('answerSummary', b, { campaignId: c.id }));
        btn(t('answersCsv'), 'btn-secondary', (b) => downloadCsv('answers', b, { campaignId: c.id }));
      }
      btn(t('deleteItem'), 'btn-danger-outline', async () => {
        if (!window.confirm(t('confirmDeleteCampaign', { name: c.name }))) return;
        try {
          await api('adminSponsorDelete', { token: ssGet(SS_ADMIN), id: c.id });
          loadDashboard();
        } catch (err) {
          if (err.code === 'admin_expired') adminSignOut(err.message);
          else showToast(err.message);
        }
      });
      card.appendChild(actions);
      els.adminSponsors.appendChild(card);
    }
  }

  // <input type="datetime-local"> works in the admin's local time.
  const toLocalInput = (ms) => {
    const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
  };
  const field = (id) => document.getElementById(id);

  function openCampaignEditor(c) {
    editingCampaign = c || null;
    pendingLogo = undefined;
    els.sfError.hidden = true;
    els.sponsorFormTitle.textContent = t(c ? 'editCampaign' : 'newCampaign');
    buildCategorySlots(c ? c.categories || [] : []);
    const now = Date.now();
    field('sf-name').value = c ? c.name : '';
    field('sf-url').value = c ? c.url : '';
    field('sf-color').value = c ? c.color : '#ff3e6c';
    field('sf-tagline-en').value = c ? c.tagline.en : '';
    field('sf-tagline-fr').value = c ? c.tagline.fr : '';
    field('sf-prize-en').value = c ? c.prize.en : '';
    field('sf-prize-fr').value = c ? c.prize.fr : '';
    field('sf-codes').value = '';
    field('sf-min-players').value = c ? c.minPlayers : 3;
    field('sf-min-rounds').value = String(c ? c.minRounds : 3);
    field('sf-email').checked = c ? c.collectEmail : false;
    field('sf-starts').value = toLocalInput(c ? c.startsAt : now);
    field('sf-ends').value = toLocalInput(c ? c.endsAt : now + 30 * 86400000);
    field('sf-active').checked = c ? c.active : true;
    field('sf-rules-en').value = c ? c.extraRules.en : '';
    field('sf-rules-fr').value = c ? c.extraRules.fr : '';
    showLogoPreview(c ? c.logo : '');
    const rep = c && c.report;
    els.sfCodesInfo.textContent = rep ? t('sfCodesInfo', { total: fmt(rep.codesTotal), left: fmt(rep.codesLeft) }) : '';
    showView('adminSponsor');
    window.scrollTo(0, 0);
  }

  // Sponsored categories: up to 3 slots, played one per round in turn.
  const SPONSOR_CATEGORY_SLOTS = 3;
  function buildCategorySlots(cats) {
    els.sfCats.innerHTML = '';
    for (let i = 0; i < SPONSOR_CATEGORY_SLOTS; i++) {
      const cat = cats[i] || { label: { en: '', fr: '' }, checkAs: 'anything' };
      const slot = document.createElement('div');
      slot.className = 'sf-cat';
      slot.innerHTML = `
        <div class="sf-cat-head">
          <span class="field-label"></span>
          <button type="button" class="btn btn-secondary btn-sm sf-generate" data-i18n="sfGenerate">Generate</button>
        </div>
        <div class="sf-row">
          <label class="field"><span class="field-label" data-i18n="sfCategoryEn">Category (English)</span><input class="sf-cat-en" type="text" maxlength="60" /></label>
          <label class="field"><span class="field-label" data-i18n="sfCategoryFr">Category (French)</span><input class="sf-cat-fr" type="text" maxlength="60" /></label>
        </div>
        <label class="field"><span class="field-label" data-i18n="sfCheckAs">Check answers as</span><select class="sf-check-as"></select></label>
      `;
      slot.querySelector('.sf-cat-head .field-label').textContent = t('sfCategoryN', { n: i + 1 });
      const select = slot.querySelector('.sf-check-as');
      for (const id of ['', ...CHECK_AS]) {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = id ? categoryLabel({ id }) : t('sfCheckNone');
        select.appendChild(opt);
      }
      slot.querySelector('.sf-cat-en').value = cat.label.en;
      slot.querySelector('.sf-cat-fr').value = cat.label.fr;
      select.value = cat.checkAs;
      slot.querySelector('.sf-generate').addEventListener('click', () => generateCategory(slot, i));
      els.sfCats.appendChild(slot);
    }
    window.i18n.applyStatic(els.sfCats);
  }

  function readCategorySlots() {
    return [...els.sfCats.querySelectorAll('.sf-cat')].map((slot) => ({
      label: { en: slot.querySelector('.sf-cat-en').value, fr: slot.querySelector('.sf-cat-fr').value },
      checkAs: slot.querySelector('.sf-check-as').value,
    }));
  }

  // Ready-made questions about the sponsor's products. An empty slot gets
  // the matching one of the first three (best, worst, would recommend);
  // after that each click picks another one not already in use.
  const SPONSOR_QUESTIONS = [
    { en: 'Best product to buy at {name}', fr: 'Meilleur produit à acheter chez {name}' },
    { en: 'Worst product you bought at {name}', fr: 'Pire produit acheté chez {name}' },
    { en: 'A product you’d recommend from {name}', fr: 'Un produit que vous recommandez chez {name}' },
    { en: 'Something you always buy at {name}', fr: 'Ce que vous achetez toujours chez {name}' },
    { en: 'Your favourite {name} product', fr: 'Votre produit {name} préféré' },
    { en: 'A product {name} should start selling', fr: 'Un produit que {name} devrait vendre' },
    { en: 'A gift you’d buy at {name}', fr: 'Un cadeau à acheter chez {name}' },
    { en: 'First thing you grab at {name}', fr: 'Premier article que vous prenez chez {name}' },
    { en: 'A product you’d like on sale at {name}', fr: 'Un produit que vous voudriez en promo chez {name}' },
    { en: 'A product you’d never buy at {name}', fr: 'Un produit que vous n’achèteriez jamais chez {name}' },
  ];
  function generateCategory(slot, index) {
    const name = field('sf-name').value.trim();
    if (!name) {
      showToast(t('sfGenerateNeedName'));
      field('sf-name').focus();
      return;
    }
    const fill = (q) => ({ en: q.en.replace('{name}', name), fr: q.fr.replace('{name}', name) });
    const en = slot.querySelector('.sf-cat-en');
    const inUse = new Set(readCategorySlots().map((c) => c.label.en.trim()));
    let pick = !en.value.trim() && SPONSOR_QUESTIONS[index] && !inUse.has(fill(SPONSOR_QUESTIONS[index]).en) ? SPONSOR_QUESTIONS[index] : null;
    if (!pick) {
      const free = SPONSOR_QUESTIONS.filter((q) => !inUse.has(fill(q).en));
      pick = free[Math.floor(Math.random() * free.length)] || SPONSOR_QUESTIONS[0];
    }
    const q = fill(pick);
    en.value = q.en;
    slot.querySelector('.sf-cat-fr').value = q.fr;
    slot.querySelector('.sf-check-as').value = 'anything';
  }

  function showLogoPreview(src) {
    els.sfLogoPreview.hidden = !src;
    els.sfLogoRemove.hidden = !src;
    if (src) els.sfLogoPreview.src = src;
    else els.sfLogoPreview.removeAttribute('src');
  }

  // Shrink the chosen logo to at most 256 px so it stays small.
  els.sfLogo.addEventListener('change', async () => {
    const file = els.sfLogo.files[0];
    els.sfLogo.value = '';
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((ok, fail) => {
        img.onload = ok;
        img.onerror = fail;
        img.src = url;
      });
      URL.revokeObjectURL(url);
      let size = 256;
      let data = '';
      for (let attempt = 0; attempt < 4; attempt++) {
        const scale = Math.min(1, size / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        data = canvas.toDataURL('image/webp', 0.85);
        if (!data.startsWith('data:image/webp')) data = canvas.toDataURL('image/png');
        if (data.length <= 110 * 1024) break;
        size = Math.round(size * 0.7);
      }
      if (data.length > 110 * 1024) throw new Error(t('sfLogoTooBig'));
      pendingLogo = data;
      showLogoPreview(data);
    } catch (err) {
      showToast(err.message || t('sfLogoTooBig'));
    }
  });
  els.sfLogoRemove.addEventListener('click', () => {
    pendingLogo = '';
    showLogoPreview('');
  });

  els.sponsorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.sfError.hidden = true;
    const toIso = (v) => (v ? new Date(v).toISOString() : '');
    const campaign = {
      id: editingCampaign ? editingCampaign.id : undefined,
      name: field('sf-name').value,
      url: field('sf-url').value,
      color: field('sf-color').value,
      tagline: { en: field('sf-tagline-en').value, fr: field('sf-tagline-fr').value },
      prize: { en: field('sf-prize-en').value, fr: field('sf-prize-fr').value },
      categories: readCategorySlots(),
      minPlayers: Number(field('sf-min-players').value),
      minRounds: Number(field('sf-min-rounds').value),
      collectEmail: field('sf-email').checked,
      extraRules: { en: field('sf-rules-en').value, fr: field('sf-rules-fr').value },
      startsAt: toIso(field('sf-starts').value),
      endsAt: toIso(field('sf-ends').value),
      active: field('sf-active').checked,
    };
    if (pendingLogo !== undefined) campaign.logo = pendingLogo;
    try {
      await api('adminSponsorSave', { token: ssGet(SS_ADMIN), campaign, addCodes: field('sf-codes').value });
      showToast(t('saved'));
      showView('admin');
      loadDashboard();
    } catch (err) {
      if (err.code === 'admin_expired') return adminSignOut(err.message);
      els.sfError.textContent = err.code === 'sponsor_invalid' ? err.serverMessage || err.message : err.message;
      els.sfError.hidden = false;
    }
  });
  els.btnNewCampaign.addEventListener('click', () => openCampaignEditor(null));
  const leaveEditor = () => {
    showView('admin');
    renderDashboard();
    window.scrollTo(0, 0);
  };
  els.btnSponsorBack.addEventListener('click', leaveEditor);
  field('sf-cancel').addEventListener('click', leaveEditor);

  // ---- full page: every feedback entry or message ----

  let listMode = null; // 'feedback' | 'messages'
  let starFilter = 0;

  function openList(mode) {
    listMode = mode;
    starFilter = 0;
    showView('adminList');
    renderList();
    window.scrollTo(0, 0);
  }

  function renderList() {
    if (!listMode || !lastDashboard) return;
    const isFeedback = listMode === 'feedback';
    const all = (isFeedback ? lastDashboard.feedback : lastDashboard.messages) || [];
    const items = isFeedback && starFilter ? all.filter((f) => f.rating === starFilter) : all;

    els.listTitle.innerHTML = `${icon(isFeedback ? 'star' : 'mail')}<span></span>`;
    els.listTitle.querySelector('span').textContent = t(isFeedback ? 'allFeedback' : 'allMessages');
    els.listCount.textContent = fmt(all.length);
    els.listSummary.textContent = isFeedback
      ? feedbackSummary(all) + (starFilter ? ` · ${t('showingOf', { shown: fmt(items.length), total: fmt(all.length) })}` : '')
      : '';
    els.listSummary.hidden = !isFeedback;
    els.starFilter.hidden = !isFeedback;
    for (const btn of els.starFilter.querySelectorAll('[data-stars]')) {
      btn.classList.toggle('is-active', Number(btn.dataset.stars) === starFilter);
    }

    els.listItems.innerHTML = '';
    if (!items.length) emptyNote(els.listItems, isFeedback ? (starFilter ? t('noMatch') : t('noFeedback')) : t('noMessages'));
    for (const item of items) els.listItems.appendChild(isFeedback ? feedbackCard(item) : messageCard(item));
  }

  for (const el of document.querySelectorAll('[data-open-list]')) {
    el.addEventListener('click', () => openList(el.dataset.openList));
  }
  for (const btn of els.starFilter.querySelectorAll('[data-stars]')) {
    btn.addEventListener('click', () => {
      starFilter = Number(btn.dataset.stars);
      renderList();
    });
  }
  els.btnListCsv.addEventListener('click', () => downloadCsv(listMode, els.btnListCsv));
  els.btnListBack.addEventListener('click', () => {
    listMode = null;
    showView('admin');
    renderDashboard();
    window.scrollTo(0, 0);
  });

  function renderDashboard() {
    const d = lastDashboard;
    if (!d) return;
    const st = d.stats;
    const today = st.days[new Date(d.generatedAt).toISOString().slice(0, 10)] || {};
    els.adminUpdated.textContent = t('updatedAt', {
      time: new Date(d.generatedAt).toLocaleTimeString(window.i18n.lang === 'fr' ? 'fr-FR' : 'en-US'),
    });

    const tiles = [
      { label: 'statVisits', value: fmt(st.visits), sub: t('today', { n: fmt(today.visits) }) },
      { label: 'statUniqueVisitors', value: fmt(st.uniqueVisitors), sub: t('today', { n: fmt(today.uniqueVisitors) }) },
      { label: 'statPlayed', value: fmt(st.uniquePlayers), sub: t('today', { n: fmt(today.uniquePlayers) }) },
      { label: 'statRoomsCreated', value: fmt(st.roomsCreated), sub: t('today', { n: fmt(today.roomsCreated) }) },
      { label: 'statGames', value: fmt(st.gamesStarted), sub: t('today', { n: fmt(today.gamesStarted) }) },
      { label: 'statRounds', value: fmt(st.roundsPlayed), sub: t('today', { n: fmt(today.roundsPlayed) }) },
      { label: 'statHours', value: hours(st.playerMs), sub: t('hoursSub', { room: hours(st.roomMs) }) },
      { label: 'statRoomsOnline', value: fmt(d.roomsOnline), live: true },
      { label: 'statPlayersOnline', value: fmt(d.playersOnline), live: true },
      { label: 'statOpenRooms', value: fmt(d.openRooms), sub: t('openSub') },
    ];
    els.adminTiles.innerHTML = '';
    for (const tile of tiles) {
      const div = document.createElement('div');
      div.className = 'stat-tile' + (tile.live ? ' is-live' : '');
      div.innerHTML = '<span class="stat-label"></span><span class="stat-value"></span><span class="stat-sub"></span>';
      div.querySelector('.stat-label').textContent = t(tile.label);
      div.querySelector('.stat-value').textContent = tile.value;
      div.querySelector('.stat-sub').textContent = tile.sub || '';
      els.adminTiles.appendChild(div);
    }

    els.adminStorage.textContent = t('storageInfo', {
      rooms: fmt(d.archivedRooms),
      days: fmt(Object.keys(st.days).length),
    });

    renderInbox(d);
    renderList();
    renderCampaigns();

    els.adminRoomsCount.textContent = fmt(d.rooms.length);
    els.adminRooms.innerHTML = '';
    if (!d.rooms.length) {
      els.adminRooms.innerHTML = '<p class="admin-empty"></p>';
      els.adminRooms.firstChild.textContent = t('noLiveRooms');
    }
    for (const room of d.rooms) {
      const card = document.createElement('div');
      card.className = 'admin-room';
      card.innerHTML = '<div class="admin-room-head"><span class="admin-room-code"></span><span class="admin-room-meta"></span></div><ul class="admin-players"></ul>';
      card.querySelector('.admin-room-code').textContent = room.code;
      card.querySelector('.admin-room-meta').textContent = t('roomMeta', {
        phase: t(`phase_${room.phase}`),
        round: room.round,
        total: room.totalRounds,
      });
      const list = card.querySelector('.admin-players');
      for (const p of room.players) {
        const li = document.createElement('li');
        li.innerHTML = `<span class="status-dot${p.online ? ' is-on' : ''}"></span>${avatarHTML(p.avatar, p.name).replace(
          'class="avatar',
          'class="avatar avatar-sm'
        )}<span class="ap-name"></span>${p.host ? `<span class="ap-crown">${icon('crown')}</span>` : ''}<span class="ap-score"></span>`;
        li.querySelector('.ap-name').textContent = p.name + (p.online ? '' : ` (${t('offline')})`);
        li.querySelector('.ap-score').textContent = t('pts', { points: p.score });
        list.appendChild(li);
      }
      els.adminRooms.appendChild(card);
    }

    // Last 14 days, newest first.
    const rows = [];
    for (let i = 0; i < 14; i++) {
      const day = new Date(d.generatedAt - i * 86400000).toISOString().slice(0, 10);
      rows.push([day, st.days[day] || {}]);
    }
    const cols = ['statVisits', 'statUniqueVisitors', 'statRoomsCreated', 'statGames', 'statRounds', 'statHours'];
    const keys = ['visits', 'uniqueVisitors', 'roomsCreated', 'gamesStarted', 'roundsPlayed', 'playerMs'];
    els.adminDays.innerHTML = '<thead><tr><th></th>' + cols.map(() => '<th></th>').join('') + '</tr></thead><tbody></tbody>';
    const ths = els.adminDays.querySelectorAll('th');
    ths[0].textContent = t('day');
    cols.forEach((c, i) => (ths[i + 1].textContent = t(c)));
    const tbody = els.adminDays.querySelector('tbody');
    for (const [day, v] of rows) {
      const tr = document.createElement('tr');
      const cells = [day, ...keys.map((k) => (k === 'playerMs' ? hours(v[k] || 0) : fmt(v[k])))];
      for (const c of cells) {
        const td = document.createElement('td');
        td.textContent = c;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  // ---------------- room closed / not found ----------------

  let closedInfo = null; // { kind: 'closed' | 'gone', code }

  function renderRoomClosed() {
    if (!closedInfo) return;
    const { kind, code } = closedInfo;
    els.closedTitle.textContent = t(kind === 'closed' ? 'roomClosedTitle' : 'roomGoneTitle');
    els.closedText.innerHTML = t(kind === 'closed' ? 'roomClosedText' : 'roomGoneText', { code: '<strong></strong>' });
    els.closedText.querySelector('strong').textContent = code || '';
  }

  // A page of its own for a room that was closed (or no longer exists).
  // The player's name and avatar are kept.
  function showRoomClosed(kind, code) {
    resetToLanding();
    closedInfo = { kind, code };
    if (invitedTo) history.replaceState(null, '', location.pathname);
    els.inviteBanner.hidden = true;
    els.codeInput.value = '';
    renderRoomClosed();
    showView('closed');
    window.scrollTo(0, 0);
  }

  function leaveClosedPage(tab) {
    closedInfo = null;
    setTab(tab);
    showView('landing');
    window.scrollTo(0, 0);
    if (tab === 'join') els.codeInput.focus();
  }
  els.btnClosedCreate.addEventListener('click', () => leaveClosedPage('create'));
  els.btnClosedJoin.addEventListener('click', () => leaveClosedPage('join'));

  // Back to the start screen because the room is gone. The player's name is
  // kept; only a deliberate "Leave" erases their saved data.
  function resetToLanding(message) {
    clearTimeout(pollTimer);
    clearTimeout(answerTimer);
    cancelAnimationFrame(timerRAF);
    myRoomCode = null;
    localStorage.removeItem(LS_CODE);
    currentState = null;
    renderedRound = 0;
    revealRound = 0;
    knownRoom = null;
    closePlayersPanel();
    showView('landing');
    if (message) showError(message);
  }

  function selectRounds(n) {
    selectedRounds = n;
    for (const btn of els.roundChoice.querySelectorAll('[data-rounds]')) {
      btn.setAttribute('aria-checked', String(Number(btn.dataset.rounds) === n));
    }
  }
  for (const btn of els.roundChoice.querySelectorAll('[data-rounds]')) {
    btn.addEventListener('click', () => selectRounds(Number(btn.dataset.rounds)));
  }
  selectRounds(selectedRounds);

  function roundsText(n) {
    return n === 1 ? t('roundsOne') : t('roundsMany', { n });
  }

  let crownPick = null; // player chosen to become the new room head

  function leaveMode() {
    const state = currentState;
    if (!state || state.hostId !== myPlayerId) return 'player';
    return state.players.some((p) => p.id !== myPlayerId) ? 'host' : 'alone';
  }

  // Fill the leave dialog for this player: a regular player just confirms;
  // the room head picks a new head or closes the room.
  function renderLeaveModal() {
    const mode = leaveMode();
    setIconText(els.leaveTitle, null, mode === 'host' ? t('hostLeaveTitle') : t('leaveTitle'));
    if (mode === 'host') els.leaveTitle.insertAdjacentHTML('beforeend', icon('crown'));
    els.leaveDesc.textContent = mode === 'host' ? t('hostLeaveText') : mode === 'alone' ? t('aloneLeaveText') : t('leaveText');
    els.hostLeave.hidden = mode !== 'host';
    els.leaveActions.hidden = mode === 'host';
    if (mode !== 'host') return;

    const others = currentState.players
      .filter((p) => p.id !== myPlayerId)
      .sort((a, b) => Number(b.connected) - Number(a.connected));
    if (!others.some((p) => p.id === crownPick)) crownPick = null;
    els.crownList.innerHTML = '';
    for (const p of others) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(p.id === crownPick));
      btn.className = 'crown-option' + (p.connected ? '' : ' is-offline');
      btn.innerHTML = `${avatarHTML(p.avatar, p.name)}<span class="crown-name"></span><span class="crown-mark">${icon('crown')}</span>`;
      btn.querySelector('.crown-name').textContent = p.name + (p.connected ? '' : ` (${t('offline')})`);
      btn.addEventListener('click', () => {
        crownPick = p.id;
        renderLeaveModal();
      });
      els.crownList.appendChild(btn);
    }
    els.btnGiveCrown.disabled = !crownPick;
  }

  function askToLeave() {
    crownPick = null;
    renderLeaveModal();
    els.leaveModal.hidden = false;
    (leaveMode() === 'host' ? els.btnHostStay : els.btnLeaveCancel).focus();
  }

  function closeLeaveModal() {
    els.leaveModal.hidden = true;
  }

  // Leave for good: remove the player from the room and erase everything
  // saved on this device (name, room, player id). The room head passes
  // { newHostId } or { closeRoom: true }.
  function leaveRoom(options = {}) {
    closeLeaveModal();
    // Remember who was playing before their data is erased, for the feedback form.
    const me = currentState && currentState.players.find((p) => p.id === myPlayerId);
    const who = { name: me ? me.name : '', avatar: myAvatar, code: myRoomCode };
    api('leave', options).catch(() => {});
    for (const key of [LS_NAME, LS_CODE, LS_PLAYER_ID, LS_AVATAR]) localStorage.removeItem(key);
    myPlayerId = null;
    myAvatar = null;
    renderAvatarGrid();
    els.nameInput.value = '';
    els.codeInput.value = '';
    resetToLanding();
    showToast(options.closeRoom ? t('closedToast') : t('leftToast'));
    if (!feedbackGiven(who.code)) setTimeout(() => openFeedback('leave', who), 700);
  }

  els.btnLeaveCancel.addEventListener('click', closeLeaveModal);
  els.btnHostStay.addEventListener('click', closeLeaveModal);
  // A room head who is alone closes the room when leaving.
  els.btnLeaveConfirm.addEventListener('click', () => leaveRoom(leaveMode() === 'alone' ? { closeRoom: true } : {}));
  els.btnGiveCrown.addEventListener('click', () => {
    if (crownPick) leaveRoom({ newHostId: crownPick });
  });
  els.btnCloseRoom.addEventListener('click', () => leaveRoom({ closeRoom: true }));
  els.leaveModal.addEventListener('click', (e) => {
    if (e.target === els.leaveModal) closeLeaveModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.leaveModal.hidden) closeLeaveModal();
  });

  els.btnLeaveLobby.addEventListener('click', askToLeave);
  els.btnStart.addEventListener('click', () => {
    els.btnStart.disabled = true;
    api('start').catch((err) => {
      els.btnStart.disabled = false;
      showToast(err.message);
    });
  });
  els.btnLeaveReveal.addEventListener('click', askToLeave);
  els.btnLeaveScores.addEventListener('click', askToLeave);
  els.btnShowScores.addEventListener('click', () => {
    revealScreen = 'scores';
    if (currentState) render(currentState);
    window.scrollTo(0, 0);
    // After the last round, ask how the game was (once per game).
    const st = currentState;
    if (st && st.reveal && st.reveal.final && !feedbackGiven(st.code)) {
      const me = st.players.find((p) => p.id === myPlayerId);
      // In a prize game, give players time to see the prize (and the winner
      // time to leave their email) before asking for a rating.
      const ask = () => {
        if (!currentState || currentState.phase !== 'reveal' || els.views.scores.hidden) return;
        const prize = currentState.yourPrize;
        const busy = els.prizeCard.contains(document.activeElement);
        const sp = sponsorFor(currentState);
        if (busy || (prize && sp && sp.collectEmail && !prize.emailSaved)) {
          setTimeout(ask, 5000);
          return;
        }
        openFeedback('game_over', { name: me ? me.name : '', avatar: myAvatar, code: st.code });
      };
      setTimeout(ask, st.sponsorId ? 15000 : 1500);
    }
  });
  els.btnPlayAgain.addEventListener('click', () => {
    els.btnPlayAgain.disabled = true;
    api('playAgain')
      .catch((err) => showToast(err.message))
      .finally(() => {
        els.btnPlayAgain.disabled = false;
      });
  });
  els.btnShowAnswers.addEventListener('click', () => {
    revealScreen = 'answers';
    if (currentState) render(currentState);
    window.scrollTo(0, 0);
  });

  // ---------------- sponsors ----------------

  // Campaign details (logo, prize…) are fetched once per campaign.
  const sponsorCache = new Map(); // id -> details, or 'loading'
  function sponsorFor(state) {
    const id = state && state.sponsorId;
    if (!id) return null;
    const cached = sponsorCache.get(id);
    if (cached && cached !== 'loading') return cached;
    if (!cached) {
      sponsorCache.set(id, 'loading');
      api('sponsorInfo', { id })
        .then((d) => {
          sponsorCache.set(id, d.sponsor);
          if (currentState) render(currentState);
        })
        .catch(() => sponsorCache.delete(id));
    }
    return null;
  }
  const sText = (obj) => (obj && (obj[window.i18n.lang] || obj.en || obj.fr)) || '';

  // Category names, including the sponsor's own category.
  function catLabel(cat) {
    if (cat.id === 'sponsor') {
      const sp = sponsorFor(currentState);
      // Several sponsor categories take turns; this round's is in the state.
      const current = currentState && (currentState.categories || []).find((c) => c.id === 'sponsor');
      const own = sp && sp.categories && sp.categories[(current && current.slot) || 0];
      return (own && sText(own.label)) || (sp && sText(sp.categoryLabel)) || (current && current.label) || cat.label || t('sponsored');
    }
    return categoryLabel(cat);
  }

  function sponsorLogo(sp, cls = 'sponsor-logo') {
    if (sp.logo) {
      const img = document.createElement('img');
      img.className = cls;
      img.alt = sp.name;
      img.src = sp.logo;
      return img;
    }
    const div = document.createElement('div');
    div.className = `${cls} sponsor-logo-fallback`;
    div.textContent = sp.name.trim().slice(0, 1).toUpperCase();
    return div;
  }

  function sponsorHead(sp) {
    const head = document.createElement('div');
    head.className = 'sponsor-head';
    head.appendChild(sponsorLogo(sp));
    const who = document.createElement('div');
    who.className = 'sponsor-who';
    who.innerHTML = '<span class="sponsor-by"></span><span class="sponsor-name"></span><span class="sponsor-tagline"></span>';
    who.querySelector('.sponsor-by').textContent = t('presentedBy');
    who.querySelector('.sponsor-name').textContent = sp.name;
    who.querySelector('.sponsor-tagline').textContent = sText(sp.tagline);
    head.appendChild(who);
    return head;
  }

  function sponsorLinks(sp) {
    const links = document.createElement('div');
    links.className = 'sponsor-links';
    const rules = document.createElement('a');
    rules.href = `/rules.html?c=${encodeURIComponent(sp.id)}`;
    rules.target = '_blank';
    rules.rel = 'noopener';
    rules.textContent = t('rulesLink');
    links.appendChild(rules);
    if (sp.url) {
      const visit = document.createElement('a');
      visit.href = sp.url;
      visit.target = '_blank';
      visit.rel = 'noopener noreferrer sponsored';
      visit.textContent = t('visitSponsor', { name: sp.name });
      visit.addEventListener('click', () => api('sponsorClick', { id: sp.id }).catch(() => {}));
      links.appendChild(visit);
    }
    return links;
  }

  function renderSponsorBanner(el, sp) {
    el.hidden = !sp;
    if (!sp) return;
    el.style.setProperty('--sponsor-color', sp.color);
    el.innerHTML = '';
    el.appendChild(sponsorHead(sp));
    if (sText(sp.prize)) {
      const prize = document.createElement('p');
      prize.className = 'sponsor-prize';
      prize.innerHTML = `${icon('trophy')}<span></span>`;
      prize.querySelector('span').textContent = t('winnerGets', { prize: sText(sp.prize) });
      el.appendChild(prize);
    }
    const need = document.createElement('p');
    need.className = 'sponsor-need';
    need.textContent = t('prizeNeeds', { players: sp.minPlayers, rounds: sp.minRounds });
    el.appendChild(need);
    el.appendChild(sponsorLinks(sp));
  }

  // Mark the sponsor's category in the answer list.
  function decorateSponsorRow(sp) {
    const row = els.categoryList.querySelector('.category-row[data-cat-id="sponsor"]');
    if (!row) return;
    row.classList.add('is-sponsored');
    row.querySelector('.category-label').textContent = catLabel({ id: 'sponsor' });
    if (sp) {
      row.style.setProperty('--sponsor-color', sp.color);
      if (!row.querySelector('.sponsor-tag')) {
        const tag = document.createElement('span');
        tag.className = 'sponsor-tag';
        if (sp.logo) tag.appendChild(sponsorLogo(sp, ''));
        tag.appendChild(document.createTextNode(sp.name));
        row.querySelector('.category-label').after(tag);
      }
    }
  }

  // Final scores: the winner's prize code, or what happened to the prize.
  let prizeCardKey = '';
  function renderPrizeCard(state) {
    const sp = sponsorFor(state);
    const final = state.reveal && state.reveal.final;
    els.prizeCard.hidden = !(final && state.sponsorId);
    if (els.prizeCard.hidden) {
      prizeCardKey = '';
      return;
    }
    const r = state.prizeResult;
    const mine = state.yourPrize;
    // Don't rebuild while the winner is typing their email.
    const key = JSON.stringify([!!sp, r, mine, window.i18n.lang]);
    if (key === prizeCardKey) return;
    prizeCardKey = key;
    const card = els.prizeCard;
    card.innerHTML = '';
    if (sp) {
      card.style.setProperty('--sponsor-color', sp.color);
      card.appendChild(sponsorHead(sp));
    }
    const add = (tag, cls, text) => {
      const el = document.createElement(tag);
      el.className = cls;
      el.textContent = text;
      card.appendChild(el);
      return el;
    };
    const name = sp ? sp.name : '';
    const prize = sp ? sText(sp.prize) : '';
    if (!r) {
      add('p', 'prize-text', t('prizeChecking'));
    } else if (mine) {
      add('h3', 'prize-title', t('youWonPrize'));
      add('p', 'prize-text', t('yourCode', { prize }));
      const row = document.createElement('div');
      row.className = 'prize-code-row';
      row.innerHTML = '<span class="prize-code"></span><button type="button" class="btn btn-secondary btn-sm"></button>';
      row.querySelector('.prize-code').textContent = mine.code;
      const copy = row.querySelector('button');
      copy.textContent = t('copyCode');
      copy.addEventListener('click', () => {
        navigator.clipboard.writeText(mine.code).then(() => showToast(t('codeCopied')), () => {});
      });
      card.appendChild(row);
      if (sp && sp.collectEmail && !mine.emailSaved) {
        const form = document.createElement('form');
        form.className = 'prize-email';
        form.innerHTML = `<p class="admin-note"></p><input type="email" required maxlength="200" autocomplete="email" /><label class="check-row"><input type="checkbox" /><span></span></label><p class="error" hidden></p><button type="submit" class="btn btn-primary"></button>`;
        form.querySelector('.admin-note').textContent = t('prizeEmailAsk', { name });
        form.querySelector('.check-row span').textContent = t('prizeEmailConsent', { name });
        form.querySelector('button').textContent = t('prizeEmailSend');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const err = form.querySelector('.error');
          err.hidden = true;
          try {
            await api('claimPrize', {
              email: form.querySelector('input[type="email"]').value,
              consent: form.querySelector('input[type="checkbox"]').checked,
            });
          } catch (ex) {
            err.textContent = ex.message;
            err.hidden = false;
          }
        });
        card.appendChild(form);
      } else if (sp && sp.collectEmail) {
        add('p', 'prize-text', t('prizeEmailSaved', { name }));
      }
      if (sp && sp.url) card.appendChild(sponsorLinks(sp));
    } else {
      const names = (r.winners || []).map((w) => w.name).join(t('and'));
      const text = {
        awarded: t('prizeAwarded', { names, prize, name }),
        already_won: t('prizeAlreadyWon', { names, name }),
        no_codes: t('prizeNoCodes', { name }),
        not_eligible: t('prizeNotEligible', { players: r.minPlayers, rounds: r.minRounds }),
      }[r.status] || t('prizeNoWinner');
      add('p', 'prize-text', text);
      if (sp) card.appendChild(sponsorLinks(sp));
    }
  }

  // ---------------- render ----------------

  function render(state, prevPhase) {
    if (!els.leaveModal.hidden) renderLeaveModal();
    if (state.phase === 'lobby') {
      // A new game (e.g. after "Play again") restarts at round 1.
      renderedRound = 0;
      revealRound = 0;
      finalSentRound = 0;
      renderLobby(state);
      showView('lobby');
    } else if (state.phase === 'playing' || state.phase === 'checking') {
      renderPlaying(state);
      if (state.phase === 'checking') renderChecking();
      showView('playing');
    } else if (state.phase === 'reveal') {
      if (revealRound !== state.round) {
        revealRound = state.round;
        revealScreen = 'answers';
      }
      renderReveal(state);
      renderScores(state);
      showView(revealScreen === 'scores' ? 'scores' : 'reveal');
    }
  }

  function renderLobby(state) {
    els.lobbyCode.textContent = state.code;
    renderSponsorBanner(els.lobbySponsor, sponsorFor(state));
    els.lobbySettings.textContent = t('lobbySettings', {
      rounds: roundsText(state.totalRounds),
      seconds: Math.round(state.duration / 1000),
      cats: state.categoriesPerRound,
    });
    els.lobbyPlayers.innerHTML = '';
    const sorted = [...state.players].sort((a, b) => a.name.localeCompare(b.name));
    for (const p of sorted) {
      const li = document.createElement('li');
      li.className = 'player-row';
      const isHost = p.id === state.hostId;
      li.innerHTML = `
        <span class="player-avatar">${avatarHTML(p.avatar, p.name)}</span>
        <span class="player-name${p.connected ? '' : ' disconnected'}"></span>
        ${isHost ? `<span class="player-crown" title="${t('host')}">${icon('crown')}</span>` : ''}
      `;
      li.querySelector('.player-name').textContent =
        p.name + (p.id === myPlayerId ? ` (${t('you')})` : '') + (p.connected ? '' : ` (${t('left')})`);
      els.lobbyPlayers.appendChild(li);
    }

    const isHost = state.hostId === myPlayerId;
    const connectedCount = state.players.filter((p) => p.connected).length;
    els.btnStart.hidden = !isHost;
    els.btnStart.disabled = connectedCount < 2;
    els.btnStart.textContent = connectedCount < 2 ? t('waitingForPlayers') : t('startGame');
    els.lobbyWaitNote.hidden = isHost;
  }

  function renderPlaying(state) {
    els.playingCode.textContent = state.code;
    els.roundCounter.textContent = t('roundOf', { round: state.round, total: state.totalRounds });
    els.roundLetter.textContent = state.letter || '?';
    els.barLetter.textContent = state.letter || '';

    // During the 3-2-1 countdown the letter is still hidden.
    if (!state.letter) {
      els.categoryList.innerHTML = '';
      answerInputs.clear();
      renderedRound = 0;
      startTimerLoop(state.startedAt, state.duration);
      renderProgress(state.progress);
      renderPlayersPanel(state);
      return;
    }

    if (renderedRound !== state.round) {
      renderedRound = state.round;
      answersDirty = false;
      els.categoryList.innerHTML = '';
      answerInputs.clear();
      for (const cat of state.categories) {
        const row = document.createElement('div');
        row.className = 'category-row';
        row.innerHTML = `
          <div class="category-badge">${state.letter}</div>
          <div class="category-fields">
            <label class="category-label"></label>
            <input class="category-input" type="text" maxlength="60" autocomplete="off" autocapitalize="words" />
          </div>
        `;
        row.dataset.catId = cat.id;
        row.querySelector('.category-label').textContent = catLabel(cat);
        const input = row.querySelector('.category-input');
        input.placeholder = t('startsWith', { letter: state.letter });
        input.value = (state.yourAnswers || {})[cat.id] || '';
        input.addEventListener('input', queueAnswerSync);
        answerInputs.set(cat.id, input);
        els.categoryList.appendChild(row);
      }
      const firstInput = els.categoryList.querySelector('.category-input');
      if (firstInput) setTimeout(() => firstInput.focus(), 150);
    }

    startTimerLoop(state.startedAt, state.duration);
    renderProgress(state.progress);
    renderPlayersPanel(state);
    if (state.sponsorId) decorateSponsorRow(sponsorFor(state));
    // Time's up but the server hasn't switched to checking yet: keep the note.
    if (serverNow() >= state.startedAt + state.duration) renderChecking();
  }

  // ---------------- timer bar pinning ----------------

  // Reserve the bar's height in the page, and keep the bar at the top of what's
  // actually visible — on phones the keyboard scrolls the visible area inside
  // the page, which would otherwise carry a fixed bar off screen.
  function syncPlayBar() {
    document.documentElement.style.setProperty('--play-bar-height', `${els.playBar.offsetHeight}px`);
    const vv = window.visualViewport;
    const offset = vv ? Math.max(0, vv.offsetTop) : 0;
    els.playBar.style.transform = offset > 0.5 ? `translateY(${offset}px)` : '';
  }
  if (window.ResizeObserver) new ResizeObserver(syncPlayBar).observe(els.playBar);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncPlayBar);
    window.visualViewport.addEventListener('scroll', syncPlayBar);
  }
  window.addEventListener('scroll', syncPlayBar, { passive: true });

  // ---------------- player list (timer bar) ----------------

  function closePlayersPanel() {
    els.playersPanel.hidden = true;
    els.playersPill.setAttribute('aria-expanded', 'false');
  }

  // The room head always has the 👥 button; everyone else only when they turn it on.
  function renderPlayersPanel(state) {
    const amHost = state.hostId === myPlayerId;
    const canSee = amHost || state.showPlayers;
    els.playersPill.hidden = !canSee;
    if (!canSee) {
      closePlayersPanel();
      return;
    }
    els.playersPill.classList.toggle('is-off', amHost && !state.showPlayers);
    els.playersCount.textContent = state.players.length;
    els.playersPill.setAttribute('aria-label', `${t('players')}: ${state.players.length}`);

    els.playersPanelTitle.textContent = t('playersInRoom', { count: state.players.length });
    els.showPlayersRow.hidden = !amHost;
    els.showPlayersSwitch.checked = !!state.showPlayers;
    els.playersPanelHint.hidden = !(amHost && !state.showPlayers);
    els.playersPanelHint.textContent = t('onlyYouSee');

    els.playersPanelList.innerHTML = '';
    for (const p of state.players) {
      const li = document.createElement('li');
      if (!p.connected) li.className = 'is-offline';
      const prog = state.progress && state.progress[p.id];
      li.innerHTML = `${avatarHTML(p.avatar, p.name).replace('class="avatar', 'class="avatar avatar-sm')}<span class="pl-name"></span>${
        p.id === state.hostId ? `<span class="pl-crown">${icon('crown')}</span>` : ''
      }<span class="pl-progress"></span>`;
      li.querySelector('.pl-name').textContent =
        p.name + (p.id === myPlayerId ? ` (${t('you')})` : '') + (p.connected ? '' : ` (${t('offline')})`);
      const progEl = li.querySelector('.pl-progress');
      if (prog) {
        progEl.textContent = `${prog.filled}/${prog.total}`;
        progEl.classList.toggle('is-done', prog.filled >= prog.total);
      }
      els.playersPanelList.appendChild(li);
    }
  }

  els.playersPill.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = els.playersPanel.hidden;
    els.playersPanel.hidden = !open;
    els.playersPill.setAttribute('aria-expanded', String(open));
  });
  els.playersPanel.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => {
    if (!els.playersPanel.hidden) closePlayersPanel();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.playersPanel.hidden) closePlayersPanel();
  });
  els.showPlayersSwitch.addEventListener('change', () => {
    const value = els.showPlayersSwitch.checked;
    api('setShowPlayers', { value }).catch((err) => {
      els.showPlayersSwitch.checked = !value;
      showToast(err.message);
    });
  });

  function renderChecking() {
    cancelAnimationFrame(timerRAF);
    els.playBar.classList.remove('is-warning', 'is-danger');
    els.timerText.textContent = t('checking');
    els.timerFill.style.width = '0%';
    for (const input of answerInputs.values()) input.disabled = true;
    els.progressRow.innerHTML = `<div class="checking-note">${icon('stopwatch')}<span></span></div>`;
    els.progressRow.querySelector('.checking-note span').textContent = t('checkingNote');
  }

  function renderProgress(progress) {
    if (!progress || !currentState) return;
    els.progressRow.innerHTML = '';
    const sorted = [...currentState.players].sort((a, b) => a.name.localeCompare(b.name));
    for (const p of sorted) {
      const info = progress[p.id] || { filled: 0, total: 1 };
      const done = info.filled >= info.total;
      const pip = document.createElement('div');
      pip.className = 'progress-pip' + (done ? ' is-done' : '') + (p.id === myPlayerId ? ' is-me' : '');
      pip.innerHTML = `<span class="dot"></span>${avatarHTML(p.avatar, p.name).replace('class="avatar', 'class="avatar avatar-sm')}<span></span>`;
      pip.querySelector('span:last-child').textContent = `${p.name} ${info.filled}/${info.total}`;
      els.progressRow.appendChild(pip);
    }
  }

  function startTimerLoop(startedAt, duration) {
    cancelAnimationFrame(timerRAF);
    function tick() {
      const now = serverNow();
      if (now < startedAt) {
        els.playBar.classList.remove('is-warning', 'is-danger');
        els.timerText.textContent = `${Math.ceil((startedAt - now) / 1000)}…`;
        els.roundLetter.textContent = String(Math.ceil((startedAt - now) / 1000));
        els.timerFill.style.width = '100%';
        timerRAF = requestAnimationFrame(tick);
        return;
      }
      if (currentState && currentState.phase === 'playing' && !currentState.letter) {
        // Countdown finished locally — fetch the letter right away.
        clearTimeout(pollTimer);
        poll();
        return;
      }
      const remaining = Math.max(0, startedAt + duration - now);
      // Amber when time is getting low, red when it's nearly up.
      const warnAt = Math.min(30000, duration / 3);
      const dangerAt = Math.min(10000, duration * 0.15);
      els.playBar.classList.toggle('is-danger', remaining > 0 && remaining <= dangerAt);
      els.playBar.classList.toggle('is-warning', remaining > dangerAt && remaining <= warnAt);
      const secs = Math.ceil(remaining / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      els.timerText.textContent = `${m}:${String(s).padStart(2, '0')}`;
      els.timerFill.style.width = `${Math.max(0, (remaining / duration) * 100)}%`;
      if (remaining > 0 && currentState && currentState.phase === 'playing') {
        timerRAF = requestAnimationFrame(tick);
      } else if (remaining === 0 && currentState && finalSentRound !== currentState.round) {
        // Time's up: lock the inputs and send final answers once.
        finalSentRound = currentState.round;
        for (const input of answerInputs.values()) input.disabled = true;
        answersDirty = answerInputs.size > 0;
        sendAnswers();
        // Show "checking" right away; results arrive with the next update.
        renderChecking();
      }
    }
    tick();
  }

  function renderReveal(state) {
    els.revealCode.textContent = state.code;
    const reveal = state.reveal;
    if (!reveal) return;

    const playersById = new Map(state.players.map((p) => [p.id, p]));
    const winner = playersById.get(reveal.winnerId);
    const roundScore = reveal.roundScores[myPlayerId] || 0;

    setIconText(
      els.revealBanner,
      winner ? 'trophy' : null,
      winner
        ? t('roundWon', { name: winner.name, round: state.round, points: reveal.roundScores[winner.id], mine: roundScore })
        : t('roundResults', { round: state.round })
    );
    document.getElementById('show-scores-label').textContent = reveal.final ? t('seeFinalScores') : t('seeScores');

    els.revealCategories.innerHTML = '';
    for (const cat of reveal.perCategory) {
      const block = document.createElement('div');
      block.className = 'reveal-cat';
      const title = document.createElement('div');
      title.className = 'reveal-cat-title';
      title.textContent = catLabel({ id: cat.catId, label: cat.label });
      block.appendChild(title);

      const answers = document.createElement('div');
      answers.className = 'reveal-answers';
      const sortedEntries = [...cat.entries].sort((a, b) => b.points - a.points);
      for (const entry of sortedEntries) {
        const player = playersById.get(entry.playerId);
        if (!player) continue;
        const chip = document.createElement('div');
        const hasText = entry.text && entry.text.length > 0;
        const notFound = entry.valid && entry.exists === false;
        const wrongCategory = entry.valid && !notFound && entry.fits === false;
        chip.className = 'answer-chip ' + (entry.valid && !notFound && !wrongCategory ? 'valid' : 'invalid');
        chip.innerHTML = `
          ${avatarHTML(player.avatar, player.name).replace('class="avatar', 'class="avatar avatar-sm')}
          <span class="answer-chip-name"></span>
          <span class="answer-chip-text"></span>
          <span class="answer-chip-points"></span>
        `;
        chip.querySelector('.answer-chip-name').textContent = player.name;
        const textEl = chip.querySelector('.answer-chip-text');
        if (hasText) {
          textEl.textContent = entry.text;
        } else {
          textEl.textContent = t('noAnswer');
          textEl.classList.add('answer-chip-empty');
        }
        let pointsLabel = '—';
        if (entry.points > 0) pointsLabel = `+${entry.points}`;
        else if (notFound) pointsLabel = t('notFound');
        else if (wrongCategory) pointsLabel = t('wrongCategory');
        else if (!entry.valid && hasText) pointsLabel = t('wrongLetter');
        else if (hasText) pointsLabel = t('dupe');
        chip.querySelector('.answer-chip-points').textContent = pointsLabel;
        if (notFound) chip.title = t('notFoundHint');
        if (wrongCategory) chip.title = t('wrongCategoryHint', { category: catLabel({ id: cat.catId, label: cat.label }) });
        answers.appendChild(chip);
      }
      block.appendChild(answers);
      els.revealCategories.appendChild(block);
    }
  }

  function renderScores(state) {
    const reveal = state.reveal;
    if (!reveal) return;
    els.scoresCode.textContent = state.code;

    const playersById = new Map(state.players.map((p) => [p.id, p]));
    const winner = playersById.get(reveal.winnerId);
    // The winner picks the next letter; if they've left, the host does.
    const winnerAway = !winner || !winner.connected;
    const amWinner = !reveal.final && (reveal.winnerId === myPlayerId || (winnerAway && state.hostId === myPlayerId));

    if (reveal.final) {
      // Game over: the winner is whoever has the most points overall.
      els.scoresRound.textContent = t('finalResults', { rounds: roundsText(state.totalRounds) });
      const best = Math.max(...state.players.map((p) => p.totalScore));
      const leaders = state.players.filter((p) => p.totalScore === best);
      setIconText(
        els.scoresWinner,
        leaders.length > 1 ? 'tie' : 'trophy',
        leaders.length > 1
          ? t('tieGame', { names: leaders.map((p) => p.name).join(t('and')) })
          : leaders[0].id === myPlayerId
            ? t('youWinGame')
            : t('playerWinsGame', { name: leaders[0].name })
      );
    } else {
      els.scoresRound.textContent = t('roundLetter', { round: state.round, total: state.totalRounds, letter: reveal.letter });
      const winPoints = winner ? reveal.roundScores[winner.id] : 0;
      setIconText(
        els.scoresWinner,
        winner ? 'trophy' : null,
        !winner
          ? t('roundOver')
          : winner.id === myPlayerId
            ? t('youWonWith', { points: winPoints })
            : t('playerWonWith', { name: winner.name, points: winPoints })
      );
    }

    renderPrizeCard(state);
    els.leaderboardList.innerHTML = '';
    const ranked = [...state.players].sort((a, b) => b.totalScore - a.totalScore);
    ranked.forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'player-row' + (p.id === myPlayerId ? ' is-me' : '');
      li.innerHTML = `
        <span class="rank">${i < 3 ? icon(`medal-${i + 1}`) : i + 1}</span>
        <span class="player-avatar">${avatarHTML(p.avatar, p.name)}</span>
        <span class="player-name"></span>
        <span class="round-points"></span>
        <span class="player-score"></span>
      `;
      li.querySelector('.player-name').textContent = p.name + (p.id === myPlayerId ? ` (${t('you')})` : '');
      li.querySelector('.round-points').textContent = `+${reveal.roundScores[p.id] || 0}`;
      li.querySelector('.player-score').textContent = t('pts', { points: p.totalScore });
      els.leaderboardList.appendChild(li);
    });

    els.letterPicker.hidden = !amWinner;
    els.revealWaitNote.hidden = amWinner;
    const amHost = state.hostId === myPlayerId;
    els.btnPlayAgain.hidden = !(reveal.final && amHost);
    if (reveal.final) {
      els.revealWaitNote.textContent = t('waitingForRestart');
      els.revealWaitNote.hidden = amHost;
    } else if (!amWinner && winner) {
      els.revealWaitNote.textContent = t('waitingForPick', { name: winner.name });
      els.revealWaitNote.hidden = false;
    }

    if (amWinner && els.letterGrid.childElementCount === 0) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      for (const L of letters) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'letter-btn';
        btn.textContent = L;
        btn.addEventListener('click', () => {
          api('chooseLetter', { letter: L }).catch((err) => showToast(err.message));
        });
        els.letterGrid.appendChild(btn);
      }
    }
    if (!amWinner) {
      els.letterGrid.innerHTML = '';
    }
  }

  setTab('join');

  // ---------------- avatars ----------------

  const AVATARS_PER_PAGE = 12;

  // Avatars in swipeable pages of 12 (4 × 3), with dots and arrows.
  function renderAvatarGrid() {
    const pager = els.avatarGrid;
    const keepScroll = pager.scrollLeft;
    pager.innerHTML = '';
    const lang = window.i18n.lang;
    let selectedPage = 0;
    for (let start = 0; start < window.AVATARS.length; start += AVATARS_PER_PAGE) {
      const page = document.createElement('div');
      page.className = 'avatar-page';
      for (const a of window.AVATARS.slice(start, start + AVATARS_PER_PAGE)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'avatar-option';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', String(a.id === myAvatar));
        btn.setAttribute('aria-label', `${a.name[lang]} — ${a.kind[lang]}`);
        btn.title = a.kind[lang];
        btn.innerHTML = `${avatarHTML(a.id)}<span></span>`;
        btn.querySelector('span:last-child').textContent = a.name[lang];
        btn.addEventListener('click', () => {
          myAvatar = a.id;
          localStorage.setItem(LS_AVATAR, a.id);
          for (const b of pager.querySelectorAll('.avatar-option')) b.setAttribute('aria-checked', String(b === btn));
          if (!els.landingError.hidden) els.landingError.hidden = true;
        });
        if (a.id === myAvatar) selectedPage = start / AVATARS_PER_PAGE;
        page.appendChild(btn);
      }
      pager.appendChild(page);
    }

    const pages = pager.children.length;
    els.avatarDots.innerHTML = '';
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', t('avatarPage', { n: i + 1 }));
      dot.addEventListener('click', () => goToAvatarPage(i));
      els.avatarDots.appendChild(dot);
    }
    // Keep the page the player was on, or open on the page with their avatar.
    pager.style.scrollBehavior = 'auto';
    pager.scrollLeft = keepScroll || selectedPage * pager.clientWidth;
    pager.style.scrollBehavior = '';
    if (selectedPage > 0) seenMoreAvatars();
    updateAvatarNav();
  }

  function showSelectedAvatarPage() {
    const i = window.AVATARS.findIndex((a) => a.id === myAvatar);
    if (i >= AVATARS_PER_PAGE && els.avatarGrid.scrollLeft === 0) {
      els.avatarGrid.style.scrollBehavior = 'auto';
      els.avatarGrid.scrollLeft = Math.floor(i / AVATARS_PER_PAGE) * els.avatarGrid.clientWidth;
      els.avatarGrid.style.scrollBehavior = '';
    }
    updateAvatarNav();
  }

  function avatarPageIndex() {
    const pager = els.avatarGrid;
    return pager.clientWidth ? Math.round(pager.scrollLeft / pager.clientWidth) : 0;
  }
  function goToAvatarPage(i) {
    const pager = els.avatarGrid;
    pager.scrollTo({ left: i * pager.clientWidth });
  }
  function seenMoreAvatars() {
    els.avatarHint.classList.add('is-seen');
  }
  function updateAvatarNav() {
    const pages = els.avatarGrid.children.length;
    const i = avatarPageIndex();
    [...els.avatarDots.children].forEach((d, n) => d.classList.toggle('is-active', n === i));
    els.avatarPrev.disabled = i <= 0;
    els.avatarNext.disabled = i >= pages - 1;
    if (i > 0) seenMoreAvatars();
  }
  els.avatarGrid.addEventListener('scroll', () => requestAnimationFrame(updateAvatarNav), { passive: true });
  els.avatarPrev.addEventListener('click', () => goToAvatarPage(avatarPageIndex() - 1));
  els.avatarNext.addEventListener('click', () => goToAvatarPage(avatarPageIndex() + 1));
  window.addEventListener('resize', () => goToAvatarPage(avatarPageIndex()));
  renderAvatarGrid();

  // ---------------- invite links ----------------

  function renderInviteBanner() {
    if (!invitedTo || myRoomCode === invitedTo) return;
    els.inviteBanner.hidden = false;
    els.inviteBanner.innerHTML = t('invitedTo', { code: '<strong></strong>' });
    els.inviteBanner.querySelector('strong').textContent = invitedTo;
  }
  if (invitedTo) {
    els.codeInput.value = invitedTo;
    setTab('join');
    renderInviteBanner();
    // Check the invite right away so a closed room shows its page before
    // the player fills anything in.
    if (myRoomCode !== invitedTo) {
      api('peek', { code: invitedTo }).catch((err) => {
        if (err.code === 'room_closed') showRoomClosed('closed', invitedTo);
        else if (err.code === 'room_not_found') showRoomClosed('gone', invitedTo);
      });
    }
  }

  els.btnInvite.addEventListener('click', async () => {
    if (!currentState) return;
    const url = `${SITE_URL}/?room=${currentState.code}`;
    const text = t('inviteShareText', { code: currentState.code });
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Letter Blitz', text, url });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // closed the share sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast(t('inviteCopied'));
    } catch {
      window.prompt(t('inviteFriends'), url);
    }
  });

  // ---------------- language ----------------

  for (const btn of document.querySelectorAll('[data-lang]')) {
    btn.addEventListener('click', () => window.i18n.setLang(btn.dataset.lang));
  }
  window.i18n.onChange(() => {
    // Relabel the answer fields in place so nothing typed is lost.
    for (const row of els.categoryList.querySelectorAll('.category-row')) {
      row.querySelector('.category-label').textContent = catLabel({ id: row.dataset.catId });
      if (currentState && currentState.letter) {
        row.querySelector('.category-input').placeholder = t('startsWith', { letter: currentState.letter });
      }
    }
    if (currentState) render(currentState);
    if (!els.landingError.hidden) els.landingError.hidden = true;
    renderAvatarGrid();
    if (!els.inviteBanner.hidden) renderInviteBanner();
    renderRoomClosed();
    renderDashboard();
    renderGameType();
    if (!els.feedbackModal.hidden) setRating(feedbackRating);
  });
  window.i18n.applyStatic();

  // Saved on this device: name, room and player id. Rejoin automatically
  // after a refresh or when the phone comes back online.
  function rejoin() {
    api('join', { code: myRoomCode, avatar: myAvatar })
      .then(schedulePoll)
      .catch((err) => {
        if (err.code === 'room_closed') showRoomClosed('closed', myRoomCode);
        else if (err.code === 'room_not_found') showRoomClosed('gone', myRoomCode);
        else if (err.fatal) resetToLanding(t('roomEnded'));
        else setTimeout(rejoin, 3000); // offline — keep trying, keep the saved data
      });
  }
  loadAvailableSponsors();

  // Count one visit per browser session. The visitor id is random and only
  // used to tell new visitors from returning ones.
  try {
    if (!sessionStorage.getItem('lb_visited')) {
      sessionStorage.setItem('lb_visited', '1');
      let visitorId = localStorage.getItem('lb_visitor');
      if (!visitorId) {
        visitorId = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem('lb_visitor', visitorId);
      }
      api('visit', { visitorId }).catch(() => {});
    }
  } catch {}

  if (ssGet(SS_ADMIN)) {
    showAdmin(); // still signed in as admin in this tab
  } else if (myRoomCode && myPlayerId && (!invitedTo || invitedTo === myRoomCode)) {
    // An invite to a different room wins over the saved one.
    rejoin();
  }
})();
