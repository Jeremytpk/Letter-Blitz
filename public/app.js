(() => {
  // The game runs in a Netlify Function (netlify/functions/game.mjs). Every
  // phone polls it about once a second to stay in sync.
  const API_URL = '/api/game';
  const POLL_FAST_MS = 1000;
  const POLL_SLOW_MS = 1500;

  const LS_NAME = 'lb_name';
  const LS_CODE = 'lb_code';
  const LS_PLAYER_ID = 'lb_player_id';

  const els = {
    views: {
      landing: document.getElementById('view-landing'),
      lobby: document.getElementById('view-lobby'),
      playing: document.getElementById('view-playing'),
      reveal: document.getElementById('view-reveal'),
    },
    nameInput: document.getElementById('name-input'),
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
  let currentState = null;
  let timerRAF = null;
  let renderedRound = 0;
  let clockOffset = 0; // server time - local time
  let pollTimer = null;
  let answerTimer = null;
  let answersDirty = false;
  let finalSentRound = 0;
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
      throw new Error("Can't reach the game. Check your connection.");
    }
    if (typeof data.now === 'number') {
      clockOffset = data.now - (sentAt + Date.now()) / 2;
    }
    if (!res.ok) {
      const err = new Error(data.error || 'Something went wrong.');
      err.fatal = res.status === 400 && /no longer in this room|Room not found/.test(data.error || '');
      throw err;
    }
    if (data.playerId) {
      myPlayerId = data.playerId;
      localStorage.setItem(LS_PLAYER_ID, myPlayerId);
    }
    if (data.state) {
      myRoomCode = data.state.code;
      localStorage.setItem(LS_CODE, myRoomCode);
      const prevPhase = currentState && currentState.phase;
      currentState = data.state;
      render(data.state, prevPhase);
    }
    return data;
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

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { els.toast.hidden = true; }, 3200);
  }

  function showView(name) {
    for (const [key, el] of Object.entries(els.views)) {
      el.hidden = key !== name;
    }
  }

  function initials(name) {
    return (name || '?').trim().slice(0, 2).toUpperCase();
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
      els.landingError.textContent = 'Enter a name first.';
      els.landingError.hidden = false;
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
      els.landingError.textContent = 'Room codes are 4 letters/numbers.';
      els.landingError.hidden = false;
      return;
    }
    myRoomCode = code;
    enterRoom('join', { code, name });
  });

  els.btnCreate.addEventListener('click', () => {
    const name = landingName();
    if (!name) return;
    myRoomCode = null;
    enterRoom('create', {
      name,
      settings: {
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
      schedulePoll();
    } catch (err) {
      showError(err.message);
    } finally {
      els.btnJoin.disabled = false;
      els.btnCreate.disabled = false;
    }
  }

  function resetToLanding(message) {
    clearTimeout(pollTimer);
    clearTimeout(answerTimer);
    cancelAnimationFrame(timerRAF);
    myRoomCode = null;
    localStorage.removeItem(LS_CODE);
    currentState = null;
    renderedRound = 0;
    showView('landing');
    if (message) showError(message);
  }

  function leaveRoom() {
    api('leave').catch(() => {});
    resetToLanding();
  }

  els.btnLeaveLobby.addEventListener('click', leaveRoom);
  els.btnStart.addEventListener('click', () => {
    els.btnStart.disabled = true;
    api('start').catch((err) => {
      els.btnStart.disabled = false;
      showToast(err.message);
    });
  });
  els.btnLeaveReveal.addEventListener('click', leaveRoom);

  // ---------------- render ----------------

  function render(state, prevPhase) {
    if (state.phase === 'lobby') {
      renderLobby(state);
      showView('lobby');
    } else if (state.phase === 'playing' || state.phase === 'checking') {
      renderPlaying(state);
      if (state.phase === 'checking') renderChecking();
      showView('playing');
    } else if (state.phase === 'reveal') {
      renderReveal(state);
      showView('reveal');
    }
  }

  function renderLobby(state) {
    els.lobbyCode.textContent = state.code;
    els.lobbyPlayers.innerHTML = '';
    const sorted = [...state.players].sort((a, b) => a.name.localeCompare(b.name));
    for (const p of sorted) {
      const li = document.createElement('li');
      li.className = 'player-row';
      const isHost = p.id === state.hostId;
      li.innerHTML = `
        <span class="player-avatar">${initials(p.name)}</span>
        <span class="player-name${p.connected ? '' : ' disconnected'}"></span>
        ${isHost ? '<span class="player-crown" title="Host">👑</span>' : ''}
      `;
      li.querySelector('.player-name').textContent = p.name + (p.connected ? '' : ' (left)');
      els.lobbyPlayers.appendChild(li);
    }

    const isHost = state.hostId === myPlayerId;
    const connectedCount = state.players.filter((p) => p.connected).length;
    els.btnStart.hidden = !isHost;
    els.btnStart.disabled = connectedCount < 2;
    els.btnStart.textContent = connectedCount < 2 ? 'Waiting for more players…' : 'Start game';
    els.lobbyWaitNote.hidden = isHost;
  }

  function renderPlaying(state) {
    els.playingCode.textContent = state.code;
    els.roundLetter.textContent = state.letter || '?';

    // During the 3-2-1 countdown the letter is still hidden.
    if (!state.letter) {
      els.categoryList.innerHTML = '';
      answerInputs.clear();
      renderedRound = 0;
      startTimerLoop(state.startedAt, state.duration);
      renderProgress(state.progress);
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
        row.querySelector('.category-label').textContent = cat.label;
        const input = row.querySelector('.category-input');
        input.placeholder = `Starts with ${state.letter}…`;
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
  }

  function renderChecking() {
    cancelAnimationFrame(timerRAF);
    els.timerText.textContent = 'Checking…';
    els.timerFill.style.width = '0%';
    for (const input of answerInputs.values()) input.disabled = true;
    els.progressRow.innerHTML = '<div class="checking-note">⏱ Time\'s up! Checking answers online…</div>';
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
      pip.innerHTML = `<span class="dot"></span><span></span>`;
      pip.querySelector('span:last-child').textContent = `${p.name} ${info.filled}/${info.total}`;
      els.progressRow.appendChild(pip);
    }
  }

  function startTimerLoop(startedAt, duration) {
    cancelAnimationFrame(timerRAF);
    function tick() {
      const now = serverNow();
      if (now < startedAt) {
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
    // The winner picks the next letter; if they've left, the host does.
    const winnerAway = !playersById.get(reveal.winnerId) || !playersById.get(reveal.winnerId).connected;
    const amWinner = reveal.winnerId === myPlayerId || (winnerAway && state.hostId === myPlayerId);
    const roundScore = reveal.roundScores[myPlayerId] || 0;

    els.revealBanner.textContent = winner
      ? `🏆 ${winner.name} won round ${state.round} with ${reveal.roundScores[winner.id]} pts — you scored ${roundScore}`
      : `Round ${state.round} results`;

    els.revealCategories.innerHTML = '';
    for (const cat of reveal.perCategory) {
      const block = document.createElement('div');
      block.className = 'reveal-cat';
      const title = document.createElement('div');
      title.className = 'reveal-cat-title';
      title.textContent = cat.label;
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
          <span class="answer-chip-name"></span>
          <span class="answer-chip-text"></span>
          <span class="answer-chip-points"></span>
        `;
        chip.querySelector('.answer-chip-name').textContent = player.name;
        const textEl = chip.querySelector('.answer-chip-text');
        if (hasText) {
          textEl.textContent = entry.text;
        } else {
          textEl.textContent = 'no answer';
          textEl.classList.add('answer-chip-empty');
        }
        let pointsLabel = '—';
        if (entry.points > 0) pointsLabel = `+${entry.points}`;
        else if (notFound) pointsLabel = 'not found';
        else if (wrongCategory) pointsLabel = 'wrong category';
        else if (!entry.valid && hasText) pointsLabel = 'wrong letter';
        else if (hasText) pointsLabel = 'dupe';
        chip.querySelector('.answer-chip-points').textContent = pointsLabel;
        if (notFound) chip.title = "Couldn't find this online — marked as doesn't exist";
        if (wrongCategory) chip.title = `Found online, but it isn't a ${cat.label.toLowerCase()}`;
        answers.appendChild(chip);
      }
      block.appendChild(answers);
      els.revealCategories.appendChild(block);
    }

    els.leaderboardList.innerHTML = '';
    const ranked = [...state.players].sort((a, b) => b.totalScore - a.totalScore);
    ranked.forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'player-row';
      li.innerHTML = `
        <span class="player-avatar">${i === 0 ? '🥇' : initials(p.name)}</span>
        <span class="player-name"></span>
        <span class="player-score"></span>
      `;
      li.querySelector('.player-name').textContent = p.name;
      li.querySelector('.player-score').textContent = `${p.totalScore} pts`;
      els.leaderboardList.appendChild(li);
    });

    els.letterPicker.hidden = !amWinner;
    els.revealWaitNote.hidden = amWinner;
    if (!amWinner && winner) {
      els.revealWaitNote.textContent = `Waiting for ${winner.name} to pick the next letter…`;
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

  // Rejoin the room after a refresh.
  if (myRoomCode && myPlayerId) {
    api('join', { code: myRoomCode })
      .then(schedulePoll)
      .catch(() => resetToLanding());
  }
})();
