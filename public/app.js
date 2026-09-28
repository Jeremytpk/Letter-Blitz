(() => {
  const { t, categoryLabel } = window.i18n;
  // The game runs in a Netlify Function (netlify/functions/game.mjs). Every
  // phone polls it about once a second to stay in sync.
  const API_URL = '/api/game';
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
    },
    nameInput: document.getElementById('name-input'),
    avatarGrid: document.getElementById('avatar-grid'),
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
    lobbySettings: document.getElementById('lobby-settings'),
    roundCounter: document.getElementById('round-counter'),
    btnPlayAgain: document.getElementById('btn-play-again'),

    scoresCode: document.getElementById('scores-code'),
    scoresRound: document.getElementById('scores-round'),
    scoresWinner: document.getElementById('scores-winner'),
    btnLeaveScores: document.getElementById('btn-leave-scores'),
    btnShowAnswers: document.getElementById('btn-show-answers'),

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
  }

  // ---------------- landing ----------------

  els.nameInput.value = localStorage.getItem(LS_NAME) || '';

  els.tabJoin.addEventListener('click', () => setTab('join'));
  els.tabCreate.addEventListener('click', () => setTab('create'));

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
    myRoomCode = null;
    enterRoom('create', {
      name,
      avatar: myAvatar,
      settings: {
        totalRounds: selectedRounds,
        duration: Number(els.durationInput.value) * 1000,
        categoriesPerRound: Number(els.catcountInput.value),
      },
    });
  });

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
      showError(err.message);
    } finally {
      els.btnJoin.disabled = false;
      els.btnCreate.disabled = false;
    }
  }

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
    api('leave', options).catch(() => {});
    for (const key of [LS_NAME, LS_CODE, LS_PLAYER_ID, LS_AVATAR]) localStorage.removeItem(key);
    myPlayerId = null;
    myAvatar = null;
    renderAvatarGrid();
    els.nameInput.value = '';
    els.codeInput.value = '';
    resetToLanding();
    showToast(options.closeRoom ? t('closedToast') : t('leftToast'));
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
        row.querySelector('.category-label').textContent = categoryLabel(cat);
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
    // Time's up but the server hasn't switched to checking yet: keep the note.
    if (serverNow() >= state.startedAt + state.duration) renderChecking();
  }

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
      title.textContent = categoryLabel({ id: cat.catId, label: cat.label });
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
        if (wrongCategory) chip.title = t('wrongCategoryHint', { category: categoryLabel({ id: cat.catId, label: cat.label }) });
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

  function renderAvatarGrid() {
    els.avatarGrid.innerHTML = '';
    for (const a of window.AVATARS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-option';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(a.id === myAvatar));
      btn.setAttribute('aria-label', `${a.name[window.i18n.lang]} — ${a.kind[window.i18n.lang]}`);
      btn.title = a.kind[window.i18n.lang];
      btn.innerHTML = `${avatarHTML(a.id)}<span></span>`;
      btn.querySelector('span:last-child').textContent = a.name[window.i18n.lang];
      btn.addEventListener('click', () => {
        myAvatar = a.id;
        localStorage.setItem(LS_AVATAR, a.id);
        for (const b of els.avatarGrid.children) b.setAttribute('aria-checked', String(b === btn));
        if (!els.landingError.hidden) els.landingError.hidden = true;
      });
      els.avatarGrid.appendChild(btn);
    }
  }
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
  }

  els.btnInvite.addEventListener('click', async () => {
    if (!currentState) return;
    const url = `${location.origin}/?room=${currentState.code}`;
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
      row.querySelector('.category-label').textContent = categoryLabel({ id: row.dataset.catId });
      if (currentState && currentState.letter) {
        row.querySelector('.category-input').placeholder = t('startsWith', { letter: currentState.letter });
      }
    }
    if (currentState) render(currentState);
    if (!els.landingError.hidden) els.landingError.hidden = true;
    renderAvatarGrid();
    if (!els.inviteBanner.hidden) renderInviteBanner();
  });
  window.i18n.applyStatic();

  // Saved on this device: name, room and player id. Rejoin automatically
  // after a refresh or when the phone comes back online.
  function rejoin() {
    api('join', { code: myRoomCode, avatar: myAvatar })
      .then(schedulePoll)
      .catch((err) => {
        if (err.fatal) resetToLanding(t('roomEnded'));
        else setTimeout(rejoin, 3000); // offline — keep trying, keep the saved data
      });
  }
  // An invite to a different room wins over the saved one.
  if (myRoomCode && myPlayerId && (!invitedTo || invitedTo === myRoomCode)) rejoin();
})();
