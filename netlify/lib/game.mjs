// ---------------------------------------------------------------------------
// Letter Blitz game logic.
//
// Each room is one JSON document in a key-value store (Netlify Blobs in
// production). Every change is a read-modify-write guarded by the document's
// ETag, so players acting at the same moment never overwrite each other.
// Phones poll `poll` about once a second; whoever polls after the clock runs
// out triggers the end of the round.
// ---------------------------------------------------------------------------

import { checkCategories } from './category.mjs';
import { createStats } from './stats.mjs';
import { createAdmin, isAdminEntry } from './admin.mjs';
import { archiveRoom, deleteArchive, listArchive, roomSummary, dailyCsv, roomsCsv, playersCsv, totalsCsv } from './archive.mjs';

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
const CHECK_TIME_LIMIT_MS = 7000; // Netlify stops a function after 10s

// `code` lets each player's page show the message in their own language.
// Rooms past their 12-hour lifetime leave the game: a summary goes to the
// admin archive (kept until the admin deletes it), then the live room — with
// its answers — is removed. Runs hourly (netlify/functions/cleanup.mjs) and
// whenever the dashboard loads.
export async function deleteExpiredRooms(store, now = Date.now()) {
  const { blobs } = await store.list({ prefix: 'room-' });
  let deleted = 0;
  for (let i = 0; i < blobs.length; i += 20) {
    await Promise.all(
      blobs.slice(i, i + 20).map(async (b) => {
        const r = await store.get(b.key, { type: 'json' });
        if (r && now - r.createdAt <= ROOM_TTL_MS) return;
        if (r) await archiveRoom(store, r, now);
        await store.delete(b.key);
        deleted += 1;
      })
    );
  }
  return deleted;
}

export class GameError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

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

export const ROUND_CHOICES = [1, 3, 5, 7, 11];
const DEFAULT_ROUNDS = 5;

function clampTotalRounds(n) {
  const r = Number(n);
  return ROUND_CHOICES.includes(r) ? r : DEFAULT_ROUNDS;
}

function clampCategoryCount(n) {
  const c = Number(n) || 9;
  return Math.min(12, Math.max(4, Math.round(c)));
}

// Avatar ids come from public/avatars.js; any simple id is accepted so
// renaming an avatar there needs no change here (unknown ids show initials).
function cleanAvatar(avatar) {
  return /^[A-Za-z][A-Za-z0-9_-]{1,23}$/.test(String(avatar || '')) ? avatar : null;
}

function cleanName(name) {
  const n = String(name || '').trim().slice(0, 20);
  if (!n) throw new GameError('name_required', 'Enter a name first.');
  return n;
}

const roomKey = (code) => `room-${code}`;

// Anyone pressing a button is clearly still here.
function touch(room, playerId, now) {
  if (room.players[playerId]) room.players[playerId].lastSeen = now;
}

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
      // exists: is it a real thing?  fits: is it the right kind of thing for this category?
      // Each is true, false, or null when it couldn't be checked (benefit of the doubt).
      const check = (valid && found.get(`${cat.id}|${text}`)) || { exists: null, fits: null };
      const { exists, fits } = check;
      const points = unique && exists !== false && fits !== false ? 10 : 0;
      return { playerId, text, valid, unique, exists, fits, points };
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
  // After the last round the game is over: no next letter, just final standings.
  const final = room.round >= (room.totalRounds || DEFAULT_ROUNDS);
  room.reveal = { round: room.round, letter: room.letter, perCategory, roundScores, winnerId, final };
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
    totalRounds: room.totalRounds || DEFAULT_ROUNDS,
    showPlayers: !!room.showPlayers,
    hostId: effectiveHostId(room, now),
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar || null,
      connected: isOnline(p, now),
      totalScore: p.totalScore,
    })),
    progress,
    reveal: room.phase === 'reveal' ? room.reveal : null,
    yourAnswers: room.answers[playerId] || {},
  };
}

export function createGame(store, { now = () => Date.now(), verify = checkCategories, adminCfg = null } = {}) {
  const stats = createStats(store, now);
  const admin = createAdmin(store, adminCfg, now);

  // The owner's secret name + avatar opens the admin sign-in instead of a room.
  function checkAdminEntry(name, avatar) {
    if (isAdminEntry(adminCfg, name, avatar)) throw new GameError('admin_login', 'Admin sign-in');
  }

  async function load(code) {
    const res = await store.getWithMetadata(roomKey(code), { type: 'json', consistency: 'strong' });
    if (!res || !res.data) return null;
    if (now() - res.data.createdAt > ROOM_TTL_MS) return null;
    if (res.data.closed) throw new GameError('room_closed', 'The host closed the room.');
    return { room: res.data, etag: res.etag };
  }

  // Read-modify-write with retry. `fn` mutates the room (or throws GameError);
  // returning false means "nothing to save".
  async function mutate(code, fn) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const loaded = await load(code);
      if (!loaded) throw new GameError('room_not_found', 'Room not found. Check the code.');
      const { room, etag } = loaded;
      const result = fn(room);
      if (result === false) return room;
      const write = await store.setJSON(roomKey(code), room, { onlyIfMatch: etag });
      if (write.modified) return room;
      await new Promise((r) => setTimeout(r, 30 + Math.random() * 120 * (attempt + 1)));
    }
    throw new GameError('busy', 'The room is busy — please try again.');
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
    const toCheck = [];
    for (const answers of Object.values(room.answers)) {
      for (const cat of room.categories) {
        const raw = String(answers[cat.id] || '').trim();
        const norm = normalize(raw);
        if (norm && norm[0] === letter) toCheck.push({ catId: cat.id, text: raw });
      }
    }
    let found = new Map();
    try {
      found = await verify(toCheck, { timeLimitMs: CHECK_TIME_LIMIT_MS });
    } catch (err) {
      console.warn('Answer check failed:', err.message);
    }

    let scored = false;
    const result = await mutate(code, (r) => {
      if (r.round !== round || r.phase !== 'checking') return false;
      scoreRound(r, found);
      scored = true;
    });
    if (scored) {
      const players = Object.keys(result.players).length;
      await stats.bump({ roundsPlayed: 1, roomMs: result.duration, playerMs: result.duration * players });
    }
    return result;
  }

  const actions = {
    async create({ name, avatar, playerId, settings = {} }) {
      checkAdminEntry(name, avatar);
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
          totalRounds: clampTotalRounds(settings.totalRounds),
          players: { [id]: { id, name: n, avatar: cleanAvatar(avatar), totalScore: 0, joinedAt: t, lastSeen: t } },
          answers: {},
          reveal: null,
          checkingSince: null,
          createdAt: t,
        };
        const write = await store.setJSON(roomKey(code), room, { onlyIfNew: true });
        if (write.modified) {
          await stats.bump({ roomsCreated: 1 });
          return { room, playerId: id };
        }
      }
      throw new GameError('create_failed', 'Could not create a room — please try again.');
    },

    async join({ code, name, avatar, playerId }) {
      if (!(playerId && name === undefined)) checkAdminEntry(name, avatar);
      let id = playerId;
      const room = await mutate(code, (r) => {
        const t = now();
        const existing = id && r.players[id];
        if (existing) {
          existing.lastSeen = t;
          if (cleanAvatar(avatar)) existing.avatar = cleanAvatar(avatar);
          return;
        }
        if (r.phase !== 'lobby') throw new GameError('game_started', 'This game already started. Ask the host for a new room.');
        const n = cleanName(name);
        const online = Object.values(r.players).filter((p) => isOnline(p, t));
        if (online.length >= MAX_PLAYERS) throw new GameError('room_full', 'Room is full.');
        if (online.some((p) => p.name.toLowerCase() === n.toLowerCase())) {
          throw new GameError('name_taken', 'That name is taken in this room. Try another.');
        }
        id = id || randomId(12);
        r.players[id] = { id, name: n, avatar: cleanAvatar(avatar), totalScore: 0, joinedAt: t, lastSeen: t };
      });
      return { room, playerId: id };
    },

    async poll({ code, playerId }) {
      const loaded = await load(code);
      if (!loaded) throw new GameError('room_not_found', 'Room not found. Check the code.');
      let { room } = loaded;
      const t = now();
      const me = room.players[playerId];
      if (!me) throw new GameError('not_in_room', 'You are no longer in this room.');

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
        if (!r.players[playerId]) throw new GameError('not_in_room', 'You are no longer in this room.');
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
      let started = false;
      const room = await mutate(code, (r) => {
        const t = now();
        touch(r, playerId, t);
        if (playerId !== effectiveHostId(r, t)) throw new GameError('host_only', 'Only the host can start the game.');
        if (r.phase !== 'lobby') return false;
        const online = Object.values(r.players).filter((p) => isOnline(p, t));
        if (online.length < MIN_PLAYERS_TO_START) throw new GameError('need_players', 'Need at least 2 players to start.');
        startRound(r, randomLetter(), t);
        started = true;
      });
      if (started) {
        // Count the game, and each player the first time they ever play.
        const firsts = await Promise.all(Object.keys(room.players).map((id) => stats.firstTime('player', id)));
        await stats.bump({ gamesStarted: 1, uniquePlayers: firsts.filter(Boolean).length });
      }
      return { room, playerId };
    },

    async chooseLetter({ code, playerId, letter }) {
      const L = String(letter || '').toUpperCase();
      if (!LETTERS.includes(L)) throw new GameError('invalid_letter', 'Pick a valid letter.');
      const room = await mutate(code, (r) => {
        const t = now();
        if (r.phase !== 'reveal') return false;
        touch(r, playerId, t);
        if (r.reveal.final) throw new GameError('game_over', 'The game is over.');
        const winner = r.players[r.reveal.winnerId];
        const winnerAway = !winner || !isOnline(winner, t);
        const allowed = playerId === r.reveal.winnerId || (winnerAway && playerId === effectiveHostId(r, t));
        if (!allowed) throw new GameError('winner_only', 'Only the round winner picks the next letter.');
        startRound(r, L, t);
      });
      return { room, playerId };
    },

    // One per browser session; visitorId is a random id kept on the device.
    async visit({ visitorId }) {
      const first = await stats.firstTime('visitor', visitorId);
      await stats.bump({ visits: 1, uniqueVisitors: first ? 1 : 0 });
      return { room: null, playerId: null };
    },

    async adminLogin({ password, passcode }, meta) {
      try {
        const token = await admin.login(String(password || ''), String(passcode || ''), meta.ip);
        return { room: null, playerId: null, extra: { adminToken: token } };
      } catch (err) {
        if (err.code === 'admin_locked') throw new GameError('admin_locked', 'Too many attempts. Try again later.');
        throw new GameError('admin_denied', 'Wrong password or passcode.');
      }
    },

    async adminStats({ token }) {
      if (!admin.verify(token)) throw new GameError('admin_expired', 'Please sign in again.');
      return { room: null, playerId: null, extra: { dashboard: await dashboard() } };
    },

    // CSV exports: 'daily' | 'rooms' | 'players' | 'totals'.
    async adminCsv({ token, dataset }) {
      if (!admin.verify(token)) throw new GameError('admin_expired', 'Please sign in again.');
      const t = now();
      const stamp = new Date(t).toISOString().slice(0, 10);
      let csv;
      if (dataset === 'daily') csv = dailyCsv(await stats.get());
      else if (dataset === 'totals') csv = totalsCsv(await stats.get(), await dashboard());
      else if (dataset === 'rooms' || dataset === 'players') {
        const rooms = [...(await currentRoomSummaries(t)), ...(await listArchive(store))];
        csv = dataset === 'rooms' ? roomsCsv(rooms) : playersCsv(rooms);
      } else throw new GameError('bad_dataset', 'Unknown export.');
      return { room: null, playerId: null, extra: { csv, filename: `letter-blitz-${dataset}-${stamp}.csv` } };
    },

    // Manual clean-up: 'archive' (archived rooms) or 'days' (daily history),
    // optionally only data from before a date ('YYYY-MM-DD').
    async adminDelete({ token, dataset, before }) {
      if (!admin.verify(token)) throw new GameError('admin_expired', 'Please sign in again.');
      const cutoff = /^\d{4}-\d{2}-\d{2}$/.test(String(before || '')) ? before : null;
      let deleted;
      if (dataset === 'archive') deleted = await deleteArchive(store, cutoff);
      else if (dataset === 'days') deleted = await stats.deleteDays(cutoff);
      else throw new GameError('bad_dataset', 'Unknown data.');
      return { room: null, playerId: null, extra: { deleted, dashboard: await dashboard() } };
    },

    // Check a room exists and is open without joining it (used for invite links).
    async peek({ code }) {
      if (!(await load(code))) throw new GameError('room_not_found', 'Room not found. Check the code.');
      return { room: null, playerId: null };
    },

    // The room head decides whether everyone can see the player list during rounds.
    async setShowPlayers({ code, playerId, value }) {
      const room = await mutate(code, (r) => {
        const t = now();
        touch(r, playerId, t);
        if (playerId !== effectiveHostId(r, t)) throw new GameError('host_only_players', 'Only the host can change this.');
        r.showPlayers = !!value;
      });
      return { room, playerId };
    },

    // After the final round the host can start over with the same players.
    async playAgain({ code, playerId }) {
      const room = await mutate(code, (r) => {
        const t = now();
        touch(r, playerId, t);
        if (playerId !== effectiveHostId(r, t)) throw new GameError('host_only_restart', 'Only the host can start a new game.');
        if (r.phase !== 'reveal' || !r.reveal.final) return false;
        r.phase = 'lobby';
        r.round = 0;
        r.letter = null;
        r.categories = [];
        r.startedAt = null;
        r.answers = {};
        r.reveal = null;
        for (const p of Object.values(r.players)) p.totalScore = 0;
      });
      return { room, playerId };
    },

    // The room head (host) leaving chooses: close the room for everyone, or
    // hand the crown to another player. Anyone else just leaves.
    async leave({ code, playerId, closeRoom, newHostId }) {
      await mutate(code, (r) => {
        if (!r.players[playerId]) return false;
        const isHost = playerId === effectiveHostId(r, now());
        if (isHost && closeRoom) {
          r.closed = true;
          return;
        }
        if (isHost && newHostId) {
          if (newHostId === playerId || !r.players[newHostId]) {
            throw new GameError('invalid_new_host', 'Pick a player who is still in the room.');
          }
          r.hostId = newHostId;
        }
        delete r.players[playerId];
        delete r.answers[playerId];
      }).catch((err) => {
        if (err instanceof GameError && err.code === 'invalid_new_host') throw err;
      });
      return { room: null, playerId: null };
    },
  };

  // Rooms still in the game (not yet archived), in archive form.
  async function currentRoomSummaries(t) {
    const { blobs } = await store.list({ prefix: 'room-' });
    const rooms = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
    return rooms
      .filter(Boolean)
      .map((r) => {
        const live = !r.closed && Object.values(r.players).some((p) => isOnline(p, t));
        return roomSummary(r, r.closed ? 'closed' : live ? 'live' : 'open', t);
      });
  }

  // Everything the admin dashboard shows. Also moves rooms past their
  // 12-hour lifetime into the archive.
  async function dashboard() {
    const t = now();
    await deleteExpiredRooms(store, t).catch((err) => console.warn('Cleanup failed:', err.message));
    const { blobs } = await store.list({ prefix: 'room-' });
    const rooms = [];
    let playersOnline = 0;
    let openRooms = 0;
    for (let i = 0; i < blobs.length; i += 20) {
      const batch = await Promise.all(
        blobs.slice(i, i + 20).map((b) => store.get(b.key, { type: 'json', consistency: 'strong' }).then((r) => [b.key, r]))
      );
      for (const [, r] of batch) {
        if (!r || t - r.createdAt > ROOM_TTL_MS || r.closed) continue;
        openRooms += 1;
        const players = Object.values(r.players).sort((a, b) => a.joinedAt - b.joinedAt);
        const online = players.filter((p) => isOnline(p, t));
        if (!online.length) continue;
        playersOnline += online.length;
        const hostId = effectiveHostId(r, t);
        rooms.push({
          code: r.code,
          phase: r.phase,
          round: r.round,
          totalRounds: r.totalRounds || DEFAULT_ROUNDS,
          createdAt: r.createdAt,
          players: players.map((p) => ({
            name: p.name,
            avatar: p.avatar || null,
            online: isOnline(p, t),
            host: p.id === hostId,
            score: p.totalScore,
          })),
        });
      }
    }
    rooms.sort((a, b) => b.createdAt - a.createdAt);
    const archived = await store.list({ prefix: 'archive-room-' });
    return {
      generatedAt: t,
      stats: await stats.get(),
      roomsOnline: rooms.length,
      openRooms,
      playersOnline,
      rooms,
      archivedRooms: archived.blobs.length,
    };
  }

  return async function handle(action, body, meta = {}) {
    const fn = actions[action];
    if (!fn) throw new GameError('unknown_action', 'Unknown action.');
    const payload = { ...body, code: String(body.code || '').trim().toUpperCase() };
    const { room, playerId, extra } = await fn(payload, meta);
    const t = now();
    return { now: t, playerId, state: room ? publicState(room, playerId, t) : null, ...extra };
  };
}
