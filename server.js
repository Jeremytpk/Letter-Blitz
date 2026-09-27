const path = require('path');
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const { checkAnswers } = require('./verify');

const app = express();
const server = http.createServer(app);

// The frontend may be hosted elsewhere (e.g. Netlify). ALLOWED_ORIGINS is a
// comma-separated list of sites allowed to connect; unset allows any origin.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const io = new Server(server, {
  cors: { origin: allowedOrigins.length ? allowedOrigins : true },
});

app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Category bank
// ---------------------------------------------------------------------------

const CATEGORY_BANK = [
  { id: 'country', label: 'Country' },
  { id: 'boy_name', label: "Boy's Name" },
  { id: 'girl_name', label: "Girl's Name" },
  { id: 'celebrity', label: 'Celebrity' },
  { id: 'capital', label: 'Capital City' },
  { id: 'animal', label: 'Animal' },
  { id: 'food', label: 'Food or Dish' },
  { id: 'movie_tv', label: 'Movie or TV Show' },
  { id: 'brand', label: 'Brand' },
  { id: 'sport', label: 'Sport' },
  { id: 'color', label: 'Color' },
  { id: 'school_subject', label: 'School Subject' },
  { id: 'app_game', label: 'App or Video Game' },
  { id: 'job', label: 'Job or Profession' },
  { id: 'city', label: 'City' },
  { id: 'fruit_veg', label: 'Fruit or Vegetable' },
  { id: 'fictional_character', label: 'Superhero or Fictional Character' },
  { id: 'song_artist', label: 'Song or Artist' },
  { id: 'body_part', label: 'Body Part' },
  { id: 'kitchen_thing', label: 'Thing Found in a Kitchen' },
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function pickRandomCategories(count) {
  const pool = [...CATEGORY_BANK];
  const picked = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

function pickRandomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

function normalize(text) {
  if (typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// Room state
// ---------------------------------------------------------------------------

/** @type {Map<string, Room>} */
const rooms = new Map();

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
function generateRoomCode() {
  let code;
  do {
    code = Array.from({ length: 4 }, () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]).join('');
  } while (rooms.has(code));
  return code;
}

const MAX_PLAYERS = 12;
const MIN_PLAYERS_TO_START = 2;
const DISCONNECT_GRACE_MS = 2 * 60 * 1000;

function createRoom(settings) {
  const code = generateRoomCode();
  const room = {
    code,
    hostId: null,
    players: new Map(), // playerId -> player
    phase: 'lobby', // lobby | playing | checking | reveal
    letter: null,
    categories: [],
    round: 0,
    startedAt: null,
    duration: clampDuration(settings && settings.duration),
    categoriesPerRound: clampCategoryCount(settings && settings.categoriesPerRound),
    winnerId: null,
    lastReveal: null,
    timer: null,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

function clampDuration(ms) {
  const n = Number(ms) || 60000;
  return Math.min(120000, Math.max(20000, Math.round(n / 1000) * 1000));
}

function clampCategoryCount(n) {
  const c = Number(n) || 6;
  return Math.min(8, Math.max(4, Math.round(c)));
}

function makePlayer(id, name) {
  return {
    id,
    name: String(name).slice(0, 20),
    connected: true,
    socketId: null,
    totalScore: 0,
    answers: {},
    disconnectedAt: null,
  };
}

function connectedPlayers(room) {
  return [...room.players.values()].filter((p) => p.connected);
}

function ensureHost(room) {
  if (room.hostId && room.players.has(room.hostId) && room.players.get(room.hostId).connected) return;
  const next = connectedPlayers(room)[0];
  room.hostId = next ? next.id : null;
}

function progressMap(room) {
  const total = room.categories.length || 1;
  const out = {};
  for (const p of room.players.values()) {
    const filled = room.categories.filter((c) => (p.answers[c.id] || '').trim().length > 0).length;
    out[p.id] = { filled, total };
  }
  return out;
}

function publicState(room) {
  return {
    code: room.code,
    phase: room.phase,
    round: room.round,
    letter: room.letter,
    categories: room.categories,
    startedAt: room.startedAt,
    duration: room.duration,
    categoriesPerRound: room.categoriesPerRound,
    hostId: room.hostId,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      totalScore: p.totalScore,
    })),
    progress: room.phase === 'playing' ? progressMap(room) : null,
    reveal: room.phase === 'reveal' ? room.lastReveal : null,
  };
}

function broadcast(room) {
  io.to(room.code).emit('state', publicState(room));
}

function startRound(room, letter, categories) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
  room.round += 1;
  room.letter = letter;
  room.categories = categories;
  room.phase = 'playing';
  room.startedAt = Date.now();
  room.winnerId = null;
  room.lastReveal = null;
  for (const p of room.players.values()) {
    p.answers = {};
  }
  room.timer = setTimeout(() => endRound(room), room.duration);
  broadcast(room);
}

async function endRound(room) {
  if (room.phase !== 'playing') return;
  room.timer = null;
  const round = room.round;

  // Lock answers and tell everyone we're checking them online.
  room.phase = 'checking';
  broadcast(room);

  const toCheck = [];
  for (const p of room.players.values()) {
    for (const cat of room.categories) {
      const raw = (p.answers[cat.id] || '').trim();
      const norm = normalize(raw);
      if (norm.length > 0 && norm[0] === room.letter.toLowerCase()) toCheck.push(raw);
    }
  }
  let found = new Map();
  try {
    found = await checkAnswers(toCheck);
  } catch (err) {
    console.warn('Answer check failed:', err.message);
  }
  // Room may have been deleted or moved on while we waited.
  if (rooms.get(room.code) !== room || room.phase !== 'checking' || room.round !== round) return;

  // Group normalized answers per category to find duplicates.
  const perCategory = room.categories.map((cat) => {
    const groups = new Map(); // normalized -> playerIds[]
    for (const p of room.players.values()) {
      const raw = p.answers[cat.id] || '';
      const norm = normalize(raw);
      const valid = norm.length > 0 && norm[0] === room.letter.toLowerCase();
      if (!valid) continue;
      if (!groups.has(norm)) groups.set(norm, []);
      groups.get(norm).push(p.id);
    }
    const entries = [...room.players.values()].map((p) => {
      const raw = (p.answers[cat.id] || '').trim();
      const norm = normalize(raw);
      const valid = norm.length > 0 && norm[0] === room.letter.toLowerCase();
      const group = valid ? groups.get(norm) : null;
      const unique = valid && group && group.length === 1;
      // true = found online, false = can't be found, null = not checked / lookup failed
      const exists = valid ? (found.has(raw) ? found.get(raw) : null) : null;
      const points = unique && exists !== false ? 10 : 0;
      return { playerId: p.id, text: raw, valid, unique, exists, points };
    });
    return { catId: cat.id, label: cat.label, entries };
  });

  const roundScores = {};
  for (const p of room.players.values()) roundScores[p.id] = 0;
  for (const cat of perCategory) {
    for (const e of cat.entries) {
      roundScores[e.playerId] += e.points;
    }
  }

  for (const p of room.players.values()) {
    p.totalScore += roundScores[p.id] || 0;
  }

  let winnerId = null;
  let bestScore = -1;
  let bestTotal = -1;
  for (const p of room.players.values()) {
    const rs = roundScores[p.id] || 0;
    if (rs > bestScore || (rs === bestScore && p.totalScore > bestTotal)) {
      bestScore = rs;
      bestTotal = p.totalScore;
      winnerId = p.id;
    }
  }

  room.phase = 'reveal';
  room.winnerId = winnerId;
  room.lastReveal = { perCategory, roundScores, winnerId, letter: room.letter };
  broadcast(room);
}

function removePlayerIfEmpty(room) {
  if (connectedPlayers(room).length === 0) {
    const hasDisconnected = [...room.players.values()].some((p) => !p.connected);
    if (!hasDisconnected) {
      if (room.timer) clearTimeout(room.timer);
      rooms.delete(room.code);
    }
  }
}

// ---------------------------------------------------------------------------
// Socket handling
// ---------------------------------------------------------------------------

io.on('connection', (socket) => {
  let currentRoomCode = null;
  let currentPlayerId = null;

  function fail(message) {
    socket.emit('error_message', { message });
  }

  socket.on('create_room', ({ name, playerId, settings } = {}) => {
    const cleanName = (name || '').trim();
    if (!cleanName) return fail('Enter a name first.');
    const room = createRoom(settings);
    const id = playerId || socket.id + '-' + Date.now();
    const player = makePlayer(id, cleanName);
    player.socketId = socket.id;
    room.players.set(id, player);
    room.hostId = id;

    currentRoomCode = room.code;
    currentPlayerId = id;
    socket.join(room.code);
    socket.emit('joined', { code: room.code, playerId: id });
    broadcast(room);
  });

  socket.on('join_room', ({ code, name, playerId } = {}) => {
    const roomCode = (code || '').trim().toUpperCase();
    const room = rooms.get(roomCode);
    if (!room) return fail('Room not found. Check the code.');

    let player = playerId ? room.players.get(playerId) : null;

    if (!player) {
      if (room.phase !== 'lobby') return fail('This game already started. Ask the host for a new room.');
      const cleanName = (name || '').trim();
      if (!cleanName) return fail('Enter a name first.');
      if (connectedPlayers(room).length >= MAX_PLAYERS) return fail('Room is full.');
      const nameTaken = [...room.players.values()].some(
        (p) => p.connected && p.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (nameTaken) return fail('That name is taken in this room. Try another.');
      const id = playerId || socket.id + '-' + Date.now();
      player = makePlayer(id, cleanName);
      room.players.set(id, player);
      ensureHost(room);
    }

    player.connected = true;
    player.disconnectedAt = null;
    player.socketId = socket.id;

    currentRoomCode = room.code;
    currentPlayerId = player.id;
    socket.join(room.code);
    socket.emit('joined', { code: room.code, playerId: player.id });
    if (room.phase === 'playing' && player.answers && Object.keys(player.answers).length) {
      socket.emit('your_answers', { answers: player.answers });
    }
    broadcast(room);
  });

  socket.on('start_game', () => {
    const room = rooms.get(currentRoomCode);
    if (!room) return;
    if (currentPlayerId !== room.hostId) return fail('Only the host can start the game.');
    if (room.phase !== 'lobby') return;
    if (connectedPlayers(room).length < MIN_PLAYERS_TO_START) return fail('Need at least 2 players to start.');
    startRound(room, pickRandomLetter(), pickRandomCategories(room.categoriesPerRound));
  });

  socket.on('answer_update', ({ catId, text } = {}) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(currentPlayerId);
    if (!player) return;
    const isRealCategory = room.categories.some((c) => c.id === catId);
    if (!isRealCategory) return;
    player.answers[catId] = String(text || '').slice(0, 60);
    io.to(room.code).emit('progress', progressMap(room));
  });

  socket.on('choose_letter', ({ letter } = {}) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.phase !== 'reveal') return;
    if (currentPlayerId !== room.winnerId) return fail('Only the round winner picks the next letter.');
    const L = String(letter || '').toUpperCase();
    if (!LETTERS.includes(L)) return fail('Pick a valid letter.');
    startRound(room, L, pickRandomCategories(room.categoriesPerRound));
  });

  socket.on('leave_room', () => {
    const room = rooms.get(currentRoomCode);
    if (room && currentPlayerId) {
      room.players.delete(currentPlayerId);
      ensureHost(room);
      broadcast(room);
      removePlayerIfEmpty(room);
    }
    socket.leave(currentRoomCode);
    currentRoomCode = null;
    currentPlayerId = null;
  });

  socket.on('disconnect', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || !currentPlayerId) return;
    const player = room.players.get(currentPlayerId);
    if (!player) return;
    player.connected = false;
    player.disconnectedAt = Date.now();
    ensureHost(room);
    broadcast(room);

    setTimeout(() => {
      const r = rooms.get(currentRoomCode);
      if (!r) return;
      const p = r.players.get(currentPlayerId);
      if (p && !p.connected && p.disconnectedAt && Date.now() - p.disconnectedAt >= DISCONNECT_GRACE_MS) {
        r.players.delete(currentPlayerId);
        ensureHost(r);
        broadcast(r);
        removePlayerIfEmpty(r);
      }
    }, DISCONNECT_GRACE_MS + 500);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Letter Blitz running on http://localhost:${PORT}`);
});
