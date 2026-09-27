// ---------------------------------------------------------------------------
// Letter Blitz game logic.
//
// Each room is one JSON document in a key-value store (Netlify Blobs in
// production). Every change is a read-modify-write guarded by the document's
// ETag, so players acting at the same moment never overwrite each other.
// Phones poll `poll` about once a second; whoever polls after the clock runs
// out triggers the end of the round.
// ---------------------------------------------------------------------------

import { checkAnswers } from './verify.mjs';

export const CATEGORY_BANK = [
  // Core categories — used first every round.
  { id: 'country', label: 'Country', core: true },
  { id: 'capital', label: 'Capital City', core: true },
  { id: 'city', label: 'City', core: true },
  { id: 'man', label: "Man's Name", core: true },
  { id: 'woman', label: "Woman's Name", core: true },
  { id: 'singer', label: 'Singer', core: true },
  { id: 'car', label: 'Car Brand or Model', core: true },
  { id: 'actor', label: 'Comedian or Actor', core: true },
  { id: 'fruit', label: 'Fruit', core: true },
  // Extras — mixed in when a room asks for more than the core set.
  { id: 'animal', label: 'Animal' },
  { id: 'food', label: 'Food or Dish' },
  { id: 'vegetable', label: 'Vegetable' },
  { id: 'athlete', label: 'Footballer or Athlete' },
  { id: 'movie_tv', label: 'Movie or TV Show' },
  { id: 'brand', label: 'Brand' },
  { id: 'job', label: 'Job or Profession' },
  { id: 'sport', label: 'Sport' },
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

const MAX_PLAYERS = 12;
const MIN_PLAYERS_TO_START = 2;
const COUNTDOWN_MS = 3500; // "3, 2, 1" before a round so every phone starts together
const ANSWER_GRACE_MS = 2500; // late answers accepted after the clock hits zero
const ONLINE_MS = 15000; // no poll for this long = shown as disconnected
const LAST_SEEN_WRITE_MS = 8000;
const CHECK_TAKEOVER_MS = 20000; // if a checker dies, another poll takes over
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;

export class GameError extends Error {}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickCategories(count) {
  const core = shuffle(CATEGORY_BANK.filter((c) => c.core));
  const extras = shuffle(CATEGORY_BANK.filter((c) => !c.core));
  const picked = new Set([...core, ...extras].slice(0, count).map((c) => c.id));
  return CATEGORY_BANK.filter((c) => picked.has(c.id)).map(({ id, label }) => ({ id, label }));
}

function randomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

function randomId(len, chars = 'abcdefghijklmnopqrstuvwxyz0123456789') {
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function normalize(text) {
  if (typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function clampDuration(ms) {
  const n = Number(ms) || 60000;
  return Math.min(180000, Math.max(20000, Math.round(n / 1000) * 1000));
}

function clampCategoryCount(n) {
  const c = Number(n) || 9;
  return Math.min(12, Math.max(4, Math.round(c)));
}

function cleanName(name) {
  const n = String(name || '').trim().slice(0, 20);
  if (!n) throw new GameError('Enter a name first.');
  return n;
}

const roomKey = (code) => `room-${code}`;

function isOnline(p, now) {
  return now - p.lastSeen < ONLINE_MS;
}

// Host is whoever created the room, handed to the next online player if they drop.
function effectiveHostId(room, now) {
  const host = room.players[room.hostId];
  if (host && isOnline(host, now)) return room.hostId;
  const next = Object.values(room.players)
    .filter((p) => isOnline(p, now))
    .sort((a, b) => a.joinedAt - b.joinedAt)[0];
  return next ? next.id : room.hostId;
}

function startRound(room, letter, now) {
  room.round += 1;
  room.letter = letter;
  room.categories = pickCategories(room.categoriesPerRound);
  room.phase = 'playing';
  room.startedAt = now + COUNTDOWN_MS;
  room.answers = {};
  room.reveal = null;
  room.checkingSince = null;
}

function scoreRound(room, found) {
  const letter = room.letter.toLowerCase();
  const players = Object.values(room.players);

  const perCategory = room.categories.map((cat) => {
    const groups = new Map();
    const rows = players.map((p) => {
      const raw = String((room.answers[p.id] || {})[cat.id] || '').trim();
      const norm = normalize(raw);
      const valid = norm.length > 0 && norm[0] === letter;
      if (valid) groups.set(norm, (groups.get(norm) || 0) + 1);
      return { playerId: p.id, text: raw, norm, valid };
    });
    const entries = rows.map(({ playerId, text, norm, valid }) => {
      const unique = valid && groups.get(norm) === 1;
      // true = found online, false = can't be found, null = lookup failed
      const exists = valid ? (found.has(text) ? found.get(text) : null) : null;
      const points = unique && exists !== false ? 10 : 0;
      return { playerId, text, valid, unique, exists, points };
    });
    return { catId: cat.id, label: cat.label, entries };
  });

  const roundScores = {};
  for (const p of players) roundScores[p.id] = 0;
  for (const cat of perCategory) for (const e of cat.entries) roundScores[e.playerId] += e.points;
  for (const p of players) p.totalScore += roundScores[p.id];

  let winnerId = null;
  let best = -1;
  let bestTotal = -1;
  for (const p of players) {
    const rs = roundScores[p.id];
    if (rs > best || (rs === best && p.totalScore > bestTotal)) {
      best = rs;
      bestTotal = p.totalScore;
      winnerId = p.id;
    }
  }

  room.phase = 'reveal';
  room.checkingSince = null;
  room.reveal = { round: room.round, letter: room.letter, perCategory, roundScores, winnerId };
}

// What every player is allowed to see.
function publicState(room, playerId, now) {
  const players = Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt);
  const total = room.categories.length || 1;
  const progress = {};
  if (room.phase === 'playing' || room.phase === 'checking') {
    for (const p of players) {
      const a = room.answers[p.id] || {};
      progress[p.id] = { filled: room.categories.filter((c) => String(a[c.id] || '').trim()).length, total };
    }
  }
  return {
    code: room.code,
    phase: room.phase,
    round: room.round,
    letter: room.phase === 'playing' && now < room.startedAt ? null : room.letter,
    categories: room.categories,
    startedAt: room.startedAt,
    duration: room.duration,
    categoriesPerRound: room.categoriesPerRound,
    hostId: effectiveHostId(room, now),
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      connected: isOnline(p, now),
      totalScore: p.totalScore,
    })),
    progress,
    reveal: room.phase === 'reveal' ? room.reveal : null,
    yourAnswers: room.answers[playerId] || {},
  };
}

export function createGame(store, { now = () => Date.now(), verify = checkAnswers } = {}) {
  async function load(code) {
    const res = await store.getWithMetadata(roomKey(code), { type: 'json', consistency: 'strong' });
    if (!res || !res.data) return null;
    if (now() - res.data.createdAt > ROOM_TTL_MS) return null;
    return { room: res.data, etag: res.etag };
  }

  // Read-modify-write with retry. `fn` mutates the room (or throws GameError);
  // returning false means "nothing to save".
  async function mutate(code, fn) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const loaded = await load(code);
      if (!loaded) throw new GameError('Room not found. Check the code.');
      const { room, etag } = loaded;
      const result = fn(room);
      if (result === false) return room;
      const write = await store.setJSON(roomKey(code), room, { onlyIfMatch: etag });
      if (write.modified) return room;
      await new Promise((r) => setTimeout(r, 30 + Math.random() * 120 * (attempt + 1)));
    }
    throw new GameError('The room is busy — please try again.');
  }

  async function finishRound(code, round) {
    // Claim the check so only one poll does the online lookups.
    let claimed = false;
    const room = await mutate(code, (r) => {
      const t = now();
      if (r.round !== round) return false;
      const timeUp = r.phase === 'playing' && t >= r.startedAt + r.duration + ANSWER_GRACE_MS;
      const stale = r.phase === 'checking' && t - r.checkingSince > CHECK_TAKEOVER_MS;
      if (!timeUp && !stale) return false;
      r.phase = 'checking';
      r.checkingSince = t;
      claimed = true;
    });
    if (!claimed) return room;

    const letter = room.letter.toLowerCase();
    const texts = [];
    for (const answers of Object.values(room.answers)) {
      for (const cat of room.categories) {
        const raw = String(answers[cat.id] || '').trim();
        const norm = normalize(raw);
        if (norm && norm[0] === letter) texts.push(raw);
      }
    }
    let found = new Map();
    try {
      found = await verify(texts);
    } catch (err) {
      console.warn('Answer check failed:', err.message);
    }

    return mutate(code, (r) => {
      if (r.round !== round || r.phase !== 'checking') return false;
      scoreRound(r, found);
    });
  }

  const actions = {
    async create({ name, playerId, settings = {} }) {
      const n = cleanName(name);
      const id = playerId || randomId(12);
      const t = now();
      for (let i = 0; i < 20; i++) {
        const code = randomId(4, ROOM_CODE_CHARS);
        const room = {
          code,
          hostId: id,
          phase: 'lobby',
          round: 0,
          letter: null,
          categories: [],
          startedAt: null,
          duration: clampDuration(settings.duration),
          categoriesPerRound: clampCategoryCount(settings.categoriesPerRound),
          players: { [id]: { id, name: n, totalScore: 0, joinedAt: t, lastSeen: t } },
          answers: {},
          reveal: null,
          checkingSince: null,
          createdAt: t,
        };
        const write = await store.setJSON(roomKey(code), room, { onlyIfNew: true });
        if (write.modified) return { room, playerId: id };
      }
      throw new GameError('Could not create a room — please try again.');
    },

    async join({ code, name, playerId }) {
      let id = playerId;
      const room = await mutate(code, (r) => {
        const t = now();
        const existing = id && r.players[id];
        if (existing) {
          existing.lastSeen = t;
          return;
        }
        if (r.phase !== 'lobby') throw new GameError('This game already started. Ask the host for a new room.');
        const n = cleanName(name);
        const online = Object.values(r.players).filter((p) => isOnline(p, t));
        if (online.length >= MAX_PLAYERS) throw new GameError('Room is full.');
        if (online.some((p) => p.name.toLowerCase() === n.toLowerCase())) {
          throw new GameError('That name is taken in this room. Try another.');
        }
        id = id || randomId(12);
        r.players[id] = { id, name: n, totalScore: 0, joinedAt: t, lastSeen: t };
      });
      return { room, playerId: id };
    },

    async poll({ code, playerId }) {
      const loaded = await load(code);
      if (!loaded) throw new GameError('Room not found. Check the code.');
      let { room } = loaded;
      const t = now();
      const me = room.players[playerId];
      if (!me) throw new GameError('You are no longer in this room.');

      const timeUp = room.phase === 'playing' && t >= room.startedAt + room.duration + ANSWER_GRACE_MS;
      const stale = room.phase === 'checking' && t - room.checkingSince > CHECK_TAKEOVER_MS;
      if (timeUp || stale) {
        room = await finishRound(code, room.round);
      } else if (t - me.lastSeen > LAST_SEEN_WRITE_MS) {
        room = await mutate(code, (r) => {
          if (!r.players[playerId]) return false;
          r.players[playerId].lastSeen = t;
        });
      }
      return { room, playerId };
    },

    async answers({ code, playerId, round, answers }) {
      const room = await mutate(code, (r) => {
        const t = now();
        if (!r.players[playerId]) throw new GameError('You are no longer in this room.');
        if (r.phase !== 'playing' || r.round !== round) return false;
        if (t < r.startedAt || t > r.startedAt + r.duration + ANSWER_GRACE_MS) return false;
        const clean = {};
        for (const cat of r.categories) {
          const text = String((answers || {})[cat.id] || '').slice(0, 60);
          if (text) clean[cat.id] = text;
        }
        r.answers[playerId] = clean;
        r.players[playerId].lastSeen = t;
      });
      return { room, playerId };
    },

    async start({ code, playerId }) {
      const room = await mutate(code, (r) => {
        const t = now();
        if (playerId !== effectiveHostId(r, t)) throw new GameError('Only the host can start the game.');
        if (r.phase !== 'lobby') return false;
        const online = Object.values(r.players).filter((p) => isOnline(p, t));
        if (online.length < MIN_PLAYERS_TO_START) throw new GameError('Need at least 2 players to start.');
        startRound(r, randomLetter(), t);
      });
      return { room, playerId };
    },

    async chooseLetter({ code, playerId, letter }) {
      const L = String(letter || '').toUpperCase();
      if (!LETTERS.includes(L)) throw new GameError('Pick a valid letter.');
      const room = await mutate(code, (r) => {
        const t = now();
        if (r.phase !== 'reveal') return false;
        const winner = r.players[r.reveal.winnerId];
        const winnerAway = !winner || !isOnline(winner, t);
        const allowed = playerId === r.reveal.winnerId || (winnerAway && playerId === effectiveHostId(r, t));
        if (!allowed) throw new GameError('Only the round winner picks the next letter.');
        startRound(r, L, t);
      });
      return { room, playerId };
    },

    async leave({ code, playerId }) {
      await mutate(code, (r) => {
        if (!r.players[playerId]) return false;
        delete r.players[playerId];
        delete r.answers[playerId];
      }).catch(() => {});
      return { room: null, playerId: null };
    },
  };

  return async function handle(action, body) {
    const fn = actions[action];
    if (!fn) throw new GameError('Unknown action.');
    const payload = { ...body, code: String(body.code || '').trim().toUpperCase() };
    const { room, playerId } = await fn(payload);
    const t = now();
    return { now: t, playerId, state: room ? publicState(room, playerId, t) : null };
  };
}
