(() => {
  // Game server URL comes from config.js (set when the frontend is hosted
  // separately, e.g. on Netlify). Empty means same origin as this page.
  const serverUrl = window.LETTER_BLITZ_SERVER || undefined;
  const socket = io(serverUrl);

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
  const answerInputs = new Map(); // catId -> input element
  const answerDebounce = new Map(); // catId -> timeout id

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
    socket.emit('join_room', { code, name, playerId: myPlayerId });
  });

  els.btnCreate.addEventListener('click', () => {
    const name = landingName();
    if (!name) return;
    socket.emit('create_room', {
      name,
      playerId: myPlayerId,
      settings: {
        duration: Number(els.durationInput.value) * 1000,
        categoriesPerRound: Number(els.catcountInput.value),
      },
    });
  });

  function leaveRoom() {
    socket.emit('leave_room');
    myPlayerId = null;
    myRoomCode = null;
    localStorage.removeItem(LS_PLAYER_ID);
    localStorage.removeItem(LS_CODE);
    currentState = null;
    showView('landing');
  }

  els.btnLeaveLobby.addEventListener('click', leaveRoom);
  els.btnLeaveReveal.addEventListener('click', leaveRoom);

  // ---------------- socket events ----------------

  socket.on('connect', () => {
    if (myRoomCode && myPlayerId) {
      socket.emit('join_room', { code: myRoomCode, playerId: myPlayerId });
    }
  });

  socket.on('joined', ({ code, playerId }) => {
    myRoomCode = code;
    myPlayerId = playerId;
    localStorage.setItem(LS_CODE, code);
    localStorage.setItem(LS_PLAYER_ID, playerId);
  });

  socket.on('error_message', ({ message }) => {
    if (els.views.landing.hidden) {
      showToast(message);
    } else {
      els.landingError.textContent = message;
      els.landingError.hidden = false;
    }
  });

  socket.on('your_answers', ({ answers }) => {
    for (const [catId, text] of Object.entries(answers || {})) {
      const input = answerInputs.get(catId);
      if (input) input.value = text;
    }
  });

  socket.on('progress', (progress) => {
    if (currentState) currentState.progress = progress;
    renderProgress(progress);
  });

  socket.on('state', (state) => {
    const prevPhase = currentState && currentState.phase;
    currentState = state;
    render(state, prevPhase);
  });

  // ---------------- render ----------------

  function render(state, prevPhase) {
    if (state.phase === 'lobby') {
      renderLobby(state);
      showView('lobby');
    } else if (state.phase === 'playing' || state.phase === 'checking') {
      renderPlaying(state, prevPhase !== 'playing' && prevPhase !== 'checking');
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

  function renderPlaying(state, isFreshRound) {
    els.playingCode.textContent = state.code;
    els.roundLetter.textContent = state.letter;

    if (isFreshRound) {
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
        input.addEventListener('input', () => {
          clearTimeout(answerDebounce.get(cat.id));
          const t = setTimeout(() => {
            socket.emit('answer_update', { catId: cat.id, text: input.value });
          }, 220);
          answerDebounce.set(cat.id, t);
        });
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
      const remaining = Math.max(0, startedAt + duration - Date.now());
      const secs = Math.ceil(remaining / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      els.timerText.textContent = `${m}:${String(s).padStart(2, '0')}`;
      els.timerFill.style.width = `${Math.max(0, (remaining / duration) * 100)}%`;
      if (remaining > 0 && currentState && currentState.phase === 'playing') {
        timerRAF = requestAnimationFrame(tick);
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
    const amWinner = reveal.winnerId === myPlayerId;
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
        chip.className = 'answer-chip ' + (entry.valid && !notFound ? 'valid' : 'invalid');
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
        else if (!entry.valid && hasText) pointsLabel = 'wrong letter';
        else if (hasText) pointsLabel = 'dupe';
        chip.querySelector('.answer-chip-points').textContent = pointsLabel;
        if (notFound) chip.title = "Couldn't find this online — marked as doesn't exist";
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
          socket.emit('choose_letter', { letter: L });
        });
        els.letterGrid.appendChild(btn);
      }
    }
    if (!amWinner) {
      els.letterGrid.innerHTML = '';
    }
  }

  setTab('join');
})();
