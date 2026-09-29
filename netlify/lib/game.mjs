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
import { archiveRoom, deleteArchive, listArchive, roomSummary, dailyCsv, roomsCsv, playersCsv, totalsCsv, feedbackCsv, messagesCsv, claimsCsv, sponsorAnswersCsv, sponsorAnswerSummaryCsv } from './archive.mjs';
import { createInbox, InboxError } from './inbox.mjs';
import { cleanText, isPlayerId, isRoomCode, underLimit } from './security.mjs';
import { campaignCategories, cleanWinnerDetails, createSponsors, publicCampaign, SponsorError, winnerFields } from './sponsors.mjs';
import { CATEGORY_SPEC } from './category-spec.mjs';
import WORD_DATA from './word-data.mjs';

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
const HOST_INACTIVE_MS = 60000; // room head silent this long = someone else holds the crown meanwhile
const LAST_SEEN_WRITE_MS = 8000;
const CHECK_TAKEOVER_MS = 20000; // if a checker dies, another poll takes over
const ROOM_TTL_MS = 6 * 60 * 60 * 1000; // a room's whole life, however busy
// A room closes for inactivity when nobody has had the app open for
// ROOM_OFFLINE_MS, or — even with players online — nobody has done anything
// (joined, played, typed, tapped) for ROOM_IDLE_MS. Online players are warned
// ROOM_IDLE_WARN_MS before that and can keep it open.
const ROOM_OFFLINE_MS = 5 * 60 * 1000;
const ROOM_IDLE_MS = 12 * 60 * 1000;
const ROOM_IDLE_WARN_MS = 2 * 60 * 1000;
const PRIZE_LOCK_MS = 50000; // a winner idle this long gives the room owner control back
const CHECK_TIME_LIMIT_MS = 7000; // Netlify stops a function after 10s

// `code` lets each player's page show the message in their own language.
// Rooms past their 6-hour lifetime leave the game: a summary goes to the
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

function clampCategoryCount(n, max = 12) {
  const c = Number(n) || 9;
  return Math.min(max, Math.max(4, Math.round(c)));
}

// Avatar ids come from public/avatars.js; any simple id is accepted so
// renaming an avatar there needs no change here (unknown ids show initials).
function cleanAvatar(avatar) {
  return /^[A-Za-z][A-Za-z0-9_-]{1,23}$/.test(String(avatar || '')) ? avatar : null;
}

// The room creator's optional party challenge for whoever finishes last
// ("The loser drinks 2 bottles of water"). Nothing involving money or bets.
const MAX_CHALLENGE = 100;
const MONEY_RE = /[$€£¥₦₵₹]|\b(money|cash|bets?|betting|wager\w*|gambl\w*|pay|pays|paid|paying|dollars?|euros?|francs?|bucks?|cfa|fcfa|usd|eur|xaf|xof|cdf|argent|pari|parier|parie|paies?|payer|payes?|fric|thunes?|mises?|miser|m-?pesa)\b/i;

function cleanChallenge(text) {
  const challenge = cleanText(text, { max: MAX_CHALLENGE });
  if (challenge && MONEY_RE.test(challenge.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
    throw new GameError('challenge_money', 'A challenge can’t involve money or bets.');
  }
  return challenge;
}

function cleanName(name) {
  const n = cleanText(name, { max: 20 });
  if (!n) throw new GameError('name_required', 'Enter a name first.');
  return n;
}

const roomKey = (code) => `room-${code}`;

// Anyone pressing a button is clearly still here.
// A player did something (not just having the app open).
function touch(room, playerId, now) {
  if (room.players[playerId]) room.players[playerId].lastSeen = now;
  room.lastActivity = now;
}

// When the room closes for inactivity if nothing happens before then.
// Rooms from before activity was tracked only close when everyone is offline.
function idleClosesAt(room) {
  return room.lastActivity ? room.lastActivity + ROOM_IDLE_MS : Infinity;
}

function closingSoon(room, now) {
  const idleAt = idleClosesAt(room);
  const lifetimeAt = room.createdAt + ROOM_TTL_MS;
  const closesAt = Math.min(idleAt, lifetimeAt);
  if (closesAt - now > ROOM_IDLE_WARN_MS) return { closesAt: null, closesReason: null };
  return { closesAt, closesReason: lifetimeAt <= idleAt ? 'lifetime' : 'idle' };
}

// Nobody online for ROOM_OFFLINE_MS, or nobody active for ROOM_IDLE_MS: it closes.
function isAbandoned(room, now) {
  const allOffline = Object.values(room.players).every((p) => now - p.lastSeen > ROOM_OFFLINE_MS);
  return allOffline || now >= idleClosesAt(room);
}

function isOnline(p, now) {
  return now - p.lastSeen < ONLINE_MS;
}

// Host is whoever created the room, handed to the next online player if they drop.
// room.hostId is the crown's owner; it only changes when the owner gives
// the crown away (see leave). While the owner has been inactive for
// HOST_INACTIVE_MS, the longest-standing player still online holds it for
// them, and it goes back to the owner as soon as they return.
function effectiveHostId(room, now) {
  const host = room.players[room.hostId];
  if (host && now - host.lastSeen < HOST_INACTIVE_MS) return room.hostId;
  const next = Object.values(room.players)
    .filter((p) => p.id !== room.hostId && isOnline(p, now))
    .sort((a, b) => a.joinedAt - b.joinedAt)[0];
  if (next) return next.id;
  if (host) return room.hostId;
  const anyone = Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt)[0];
  return anyone ? anyone.id : room.hostId;
}

// The sponsor's categories in a room: [{ label, checkAs }]. Rooms created
// before sponsors could have several kept a single one.
function sponsorCategories(sponsor) {
  if (!sponsor) return [];
  if (sponsor.categories) return sponsor.categories;
  return sponsor.hasCategory ? [{ label: sponsor.categoryLabel, checkAs: sponsor.checkAs }] : [];
}

// This round's sponsor category, if any.
function roundSponsorCategory(room) {
  const cat = room.categories.find((c) => c.id === 'sponsor');
  return cat ? sponsorCategories(room.sponsor)[cat.slot || 0] || null : null;
}

// ---------------------------------------------------------------------------
// Word Blitz: every player gets the same words with letters missing, one per
// category, in the language the room creator picked. 10 points per word
// completed; players tap "Done" to stop their clock, and the round goes to
// whoever has the most words right, then the earliest finish. The round
// winner picks the next round's difficulty.
// ---------------------------------------------------------------------------

export const WORD_CATEGORIES = ['country', 'capital', 'city', 'fruit', 'vegetable', 'animal', 'food', 'job', 'sport', 'brand'];
// Share of letters shown (besides the first one, which always is).
const DIFFICULTY_SHOWN = { easy: 0.55, medium: 0.4, hard: 0.25 };
const WORD_POINTS = 10;

const isWordGame = (room) => room.gameType === 'word';
const plainWord = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

// The word with letters hidden: an array of letters, null where one is missing.
function maskWord(word, level) {
  const chars = [...word];
  const letters = chars.map((c, i) => (/\p{L}/u.test(c) ? i : -1)).filter((i) => i >= 0);
  const rest = letters.slice(1);
  const showCount = Math.min(rest.length - 2, Math.round(rest.length * DIFFICULTY_SHOWN[level]));
  const shown = new Set([letters[0], ...shuffle(rest).slice(0, Math.max(0, showCount))]);
  return chars.map((c, i) => (shown.has(i) ? c.toUpperCase() : null));
}

function startWordRound(room, level, now) {
  room.round += 1;
  room.letter = null;
  room.difficulty = level;
  const bank = WORD_DATA[room.wordLang] || WORD_DATA.en;
  const cats = shuffle(WORD_CATEGORIES.filter((c) => (bank[c] || []).length)).slice(0, room.categoriesPerRound);
  room.usedWords = room.usedWords || [];
  room.words = {};
  room.categories = cats.map((id) => {
    // A word not played yet in this room, if any are left.
    const fresh = bank[id].filter((w) => !room.usedWords.includes(`${id}|${w.word}`));
    const pool = fresh.length ? fresh : bank[id];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    room.usedWords.push(`${id}|${pick.word}`);
    room.words[id] = pick.word;
    return { id, label: id, pattern: maskWord(pick.word, level) };
  });
  room.phase = 'playing';
  room.startedAt = now + COUNTDOWN_MS;
  room.answers = {};
  room.finished = {};
  room.reveal = null;
  room.checkingSince = null;
}

// Everyone online has tapped "Done": the round can end early.
function allFinished(room, now) {
  if (!isWordGame(room) || room.phase !== 'playing') return false;
  const online = Object.values(room.players).filter((p) => isOnline(p, now));
  return online.length > 0 && online.every((p) => room.finished && room.finished[p.id]);
}

// How long a player took this round: until "Done", or the whole round.
function finishTime(room, playerId) {
  const at = room.finished && room.finished[playerId];
  return at ? Math.min(room.duration, Math.max(0, at - room.startedAt)) : room.duration;
}

function scoreWordRound(room) {
  const players = Object.values(room.players);
  const bank = WORD_DATA[room.wordLang] || WORD_DATA.en;
  const perCategory = room.categories.map((cat) => {
    const word = room.words[cat.id];
    const entry = (bank[cat.id] || []).find((w) => w.word === word);
    const entries = players.map((p) => {
      const text = String((room.answers[p.id] || {})[cat.id] || '').trim();
      const correct = !!text && plainWord(text) === plainWord(word);
      return { playerId: p.id, text, correct, points: correct ? WORD_POINTS : 0 };
    });
    return { catId: cat.id, label: cat.label, word, pattern: cat.pattern, meaning: entry ? entry.meaning : null, entries };
  });

  const roundScores = {};
  const correct = {};
  const times = {};
  for (const p of players) {
    correct[p.id] = perCategory.filter((c) => c.entries.find((e) => e.playerId === p.id).correct).length;
    roundScores[p.id] = correct[p.id] * WORD_POINTS;
    times[p.id] = finishTime(room, p.id);
    p.totalScore += roundScores[p.id];
    p.totalTime = (p.totalTime || 0) + times[p.id];
  }
  // Most words right, then the earliest finish.
  const ranked = [...players].sort((a, b) => correct[b.id] - correct[a.id] || times[a.id] - times[b.id]);
  const winnerId = ranked.length && correct[ranked[0].id] > 0 ? ranked[0].id : null;

  room.phase = 'reveal';
  room.checkingSince = null;
  const final = room.round >= (room.totalRounds || DEFAULT_ROUNDS);
  room.reveal = { gameType: 'word', round: room.round, difficulty: room.difficulty, perCategory, roundScores, correct, times, winnerId, final };
}

function startRound(room, letter, now) {
  room.round += 1;
  room.letter = letter;
  room.categories = pickCategories(room.categoriesPerRound);
  // One of the sponsor's categories (if any) is played every round, after the
  // others; with several, they take turns (round 1 → first, round 2 → second…).
  const sponsorCats = sponsorCategories(room.sponsor);
  if (sponsorCats.length) {
    const slot = (room.round - 1) % sponsorCats.length;
    room.categories.push({ id: 'sponsor', label: sponsorCats[slot].label, slot });
  }
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

// Details a sponsored room's winners are asked for (set when it was created).
function roomWinnerFields(room) {
  return (room.sponsor && room.sponsor.winnerFields) || [];
}

// What a winner sees of their prize: the code, and whether they still need
// to send the details the campaign asks for (the sponsor needs them to hand
// the prize over).
function prizeFor(room, playerId) {
  const prize = room.prizes && room.prizes[playerId];
  if (!prize) return null;
  const detailsSaved = !!prize.emailSaved;
  const skipped = !!prize.skipped;
  const needsDetails = roomWinnerFields(room).length > 0 && !detailsSaved && !skipped;
  return { code: skipped ? null : prize.code, needsDetails, skipped, fields: roomWinnerFields(room), detailsSaved, emailSaved: detailsSaved };
}

// Winners still in the room who haven't yet sent their details or skipped
// their prize.
function pendingWinners(room) {
  return Object.keys(room.prizes || {}).filter((id) => room.players[id] && (prizeFor(room, id) || {}).needsDetails);
}

// While a winner is deciding (send details or skip), the room owner can't
// close the room or start a new game — until the winner has been idle for
// PRIZE_LOCK_MS.
function prizeLocked(room, now) {
  return pendingWinners(room).length > 0 && now < (room.prizeLockUntil || 0);
}

// What every player is allowed to see.
function publicState(room, playerId, now) {
  const players = Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt);
  const countingDown = room.phase === 'playing' && now < room.startedAt;
  const total = room.categories.length || 1;
  const progress = {};
  if (room.phase === 'playing' || room.phase === 'checking') {
    for (const p of players) {
      const a = room.answers[p.id] || {};
      progress[p.id] = {
        filled: room.categories.filter((c) => String(a[c.id] || '').trim()).length,
        total,
        done: !!(room.finished && room.finished[p.id]),
      };
    }
  }
  return {
    code: room.code,
    phase: room.phase,
    round: room.round,
    letter: room.phase === 'playing' && now < room.startedAt ? null : room.letter,
    // The words (Word Blitz) show once the 3-2-1 countdown is over.
    categories: countingDown ? room.categories.map(({ id, label }) => ({ id, label })) : room.categories,
    revealed: !countingDown,
    gameType: room.gameType || 'letter',
    wordLang: room.wordLang || null,
    difficulty: room.difficulty || null,
    yourFinishTime: room.finished && room.finished[playerId] ? finishTime(room, playerId) : null,
    startedAt: room.startedAt,
    duration: room.duration,
    categoriesPerRound: room.categoriesPerRound,
    totalRounds: room.totalRounds || DEFAULT_ROUNDS,
    showPlayers: !!room.showPlayers,
    // Set during the last ROOM_IDLE_WARN_MS before the room closes, with why:
    // 'idle' (nobody playing — can be kept open) or 'lifetime' (6-hour limit).
    ...closingSoon(room, now),
    challenge: room.challenge || '',
    hostId: effectiveHostId(room, now),
    ownerId: room.hostId,
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar || null,
      connected: isOnline(p, now),
      totalScore: p.totalScore,
      totalTime: p.totalTime || 0,
    })),
    progress,
    reveal: room.phase === 'reveal' ? room.reveal : null,
    yourAnswers: room.answers[playerId] || {},
    sponsorId: room.sponsor ? room.sponsor.id : null,
    prizeResult: room.prizeResult || null,
    // Prize codes go only to the player who won them.
    yourPrize: prizeFor(room, playerId),
    // Winners who still have to send their details or skip their prize;
    // until prizeLockUntil the owner can't close the room or start again.
    prizeDetailsPending: pendingWinners(room),
    prizeLocked: prizeLocked(room, now),
    prizeLockUntil: room.prizeLockUntil || 0,
  };
}

export function createGame(store, { now = () => Date.now(), verify = checkCategories, adminCfg = null } = {}) {
  const stats = createStats(store, now);
  const admin = createAdmin(store, adminCfg, now);
  const inbox = createInbox(store, now);
  const sponsors = createSponsors(store, now, Object.keys(CATEGORY_SPEC));

  async function sponsorCall(fn) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof SponsorError) throw new GameError(err.code, err.message);
      throw err;
    }
  }

  // After the last round of a sponsored game: prizes for the winner(s) of an
  // eligible game (enough players and rounds), one per player per campaign.
  async function awardPrizes(code, room) {
    const campaign = await sponsors.get(room.sponsor.id);
    const players = Object.values(room.players);
    const best = Math.max(0, ...players.map((p) => p.totalScore));
    const winners = best > 0 ? players.filter((p) => p.totalScore === best) : [];
    let result;
    const prizes = {};
    if (!campaign) result = { status: 'ended' };
    else if (players.length < room.sponsor.minPlayers || (room.totalRounds || DEFAULT_ROUNDS) < room.sponsor.minRounds) {
      result = { status: 'not_eligible', minPlayers: room.sponsor.minPlayers, minRounds: room.sponsor.minRounds };
    } else if (!winners.length) result = { status: 'no_winner' };
    else {
      const outcomes = [];
      for (const w of winners) {
        const out = await sponsors.award(campaign, w, code);
        outcomes.push({ name: w.name, status: out.status });
        if (out.status === 'awarded') prizes[w.id] = { code: out.code, claimKey: out.claimKey };
      }
      result = { status: Object.keys(prizes).length ? 'awarded' : outcomes[0].status, winners: outcomes };
      if (Object.keys(prizes).length) await sponsors.bump(campaign.id, { prizes: Object.keys(prizes).length });
    }
    if (campaign) await sponsors.bump(campaign.id, { gamesCompleted: 1 });
    return mutate(code, (r) => {
      if (r.prizeResult) return false;
      r.prizeResult = result;
      r.prizes = prizes;
      r.prizeLockUntil = now() + PRIZE_LOCK_MS;
    });
  }

  // Turn inbox problems into errors the page can translate.
  async function inboxCall(fn) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof InboxError) throw new GameError(err.code, err.message);
      throw err;
    }
  }

  // The owner's secret name + avatar opens the admin sign-in instead of a room.
  function checkAdminEntry(name, avatar) {
    if (isAdminEntry(adminCfg, name, avatar)) throw new GameError('admin_login', 'Admin sign-in');
  }

  function closedError(room) {
    return room.closedReason === 'inactive'
      ? new GameError('room_inactive', 'This room was closed for inactivity.')
      : new GameError('room_closed', 'The host closed the room.');
  }

  async function load(code) {
    const res = await store.getWithMetadata(roomKey(code), { type: 'json', consistency: 'strong' });
    if (!res || !res.data) return null;
    const room = res.data;
    const t = now();
    if (room.closed) throw closedError(room);
    // Past its 6-hour life (until the hourly clean-up removes it).
    if (t - room.createdAt > ROOM_TTL_MS) throw new GameError('room_expired', 'This room reached its 6-hour limit and closed.');
    // Nobody online for 5 minutes, or nobody active for 12: it closes for good.
    if (isAbandoned(room, t)) {
      room.closed = true;
      room.closedReason = 'inactive';
      await store.setJSON(roomKey(code), room, { onlyIfMatch: res.etag }).catch(() => {});
      throw closedError(room);
    }
    return { room, etag: res.etag };
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
      const timeUp = r.phase === 'playing' && (t >= r.startedAt + r.duration + ANSWER_GRACE_MS || allFinished(r, t));
      const stale = r.phase === 'checking' && t - r.checkingSince > CHECK_TAKEOVER_MS;
      if (!timeUp && !stale) return false;
      r.phase = 'checking';
      r.checkingSince = t;
      claimed = true;
    });
    if (!claimed) return room;

    // Word Blitz: answers are simply compared with the hidden words.
    if (isWordGame(room)) {
      let scoredWords = false;
      const result = await mutate(code, (r) => {
        if (r.round !== round || r.phase !== 'checking') return false;
        scoreWordRound(r);
        scoredWords = true;
      });
      if (scoredWords) {
        const players = Object.keys(result.players).length;
        await stats.bump({ roundsPlayed: 1, roomMs: result.duration, playerMs: result.duration * players });
      }
      return result;
    }

    const letter = room.letter.toLowerCase();
    // The sponsor's category is checked with the rule the admin picked for it (if any).
    const sponsorCheck = (roundSponsorCategory(room) || {}).checkAs || '';
    const toCheck = [];
    for (const answers of Object.values(room.answers)) {
      for (const cat of room.categories) {
        const raw = String(answers[cat.id] || '').trim();
        const norm = normalize(raw);
        if (!norm || norm[0] !== letter) continue;
        const catId = cat.id === 'sponsor' ? sponsorCheck : cat.id;
        if (catId) toCheck.push({ catId, text: raw });
      }
    }
    let found = new Map();
    try {
      found = await verify(toCheck, { timeLimitMs: CHECK_TIME_LIMIT_MS });
    } catch (err) {
      console.warn('Answer check failed:', err.message);
    }
    if (sponsorCheck) {
      for (const [key, value] of [...found]) {
        const [catId, ...rest] = key.split('|');
        if (catId === sponsorCheck) found.set(`sponsor|${rest.join('|')}`, value);
      }
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
      // Keep what players answered in the sponsor's category, for the sponsor.
      const sponsorCat = result.sponsor && result.reveal && result.reveal.perCategory.find((c) => c.catId === 'sponsor');
      if (sponsorCat) {
        const label = (roundSponsorCategory(result) || {}).label || sponsorCat.label;
        const saved = await sponsors.recordAnswers(result.sponsor.id, result, round, result.letter, label, sponsorCat.entries);
        if (saved) await sponsors.bump(result.sponsor.id, { answers: saved });
      }
      if (result.sponsor && result.reveal && result.reveal.final) {
        try {
          return await awardPrizes(code, result);
        } catch (err) {
          console.error('Prize award failed:', err);
        }
      }
    }
    return result;
  }

  const actions = {
    async create({ name, avatar, playerId, settings = {} }, meta) {
      checkAdminEntry(name, avatar);
      const n = cleanName(name);
      if (!(await underLimit(store, 'create', meta.ip, 30, 3600000, now()))) {
        throw new GameError('too_many', 'Too many rooms created. Try again later.');
      }
      const challenge = cleanChallenge(settings.challenge);
      const gameType = settings.gameType === 'word' ? 'word' : 'letter';
      // Real prizes are for Letter Blitz only (for now).
      if (gameType === 'word' && settings.sponsorId) {
        throw new GameError('word_no_prizes', 'Real prizes are only for Letter Blitz for now.');
      }
      const id = playerId || randomId(12);
      const t = now();
      // A "real prizes" game uses the sponsor the creator picked, if it's live.
      let campaign = null;
      if (settings.sponsorId) {
        campaign = (await sponsors.live()).find((c) => c.id === settings.sponsorId) || null;
        if (!campaign) throw new GameError('sponsor_unavailable', 'That sponsor isn’t available any more. Pick another or play just for fun.');
      }
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
          gameType,
          wordLang: gameType === 'word' ? (settings.wordLang === 'fr' ? 'fr' : 'en') : null,
          categoriesPerRound: clampCategoryCount(settings.categoriesPerRound, gameType === 'word' ? WORD_CATEGORIES.length : 12),
          totalRounds: clampTotalRounds(settings.totalRounds),
          challenge,
          players: { [id]: { id, name: n, avatar: cleanAvatar(avatar), totalScore: 0, joinedAt: t, lastSeen: t } },
          answers: {},
          reveal: null,
          checkingSince: null,
          createdAt: t,
          lastActivity: t,
          sponsor: campaign
            ? {
                id: campaign.id,
                categories: campaignCategories(campaign).map((c) => ({ label: c.label.en || c.label.fr, checkAs: c.checkAs })),
                winnerFields: winnerFields(campaign),
                minPlayers: campaign.minPlayers,
                minRounds: campaign.minRounds,
              }
            : null,
        };
        const write = await store.setJSON(roomKey(code), room, { onlyIfNew: true });
        if (write.modified) {
          await stats.bump({ roomsCreated: 1 });
          if (campaign) await sponsors.bump(campaign.id, { rooms: 1 });
          return { room, playerId: id };
        }
      }
      throw new GameError('create_failed', 'Could not create a room — please try again.');
    },

    async join({ code, name, avatar, playerId, acceptedChallenge }, meta) {
      if (!(playerId && name === undefined)) checkAdminEntry(name, avatar);
      let id = playerId;
      const rejoining = playerId && name === undefined;
      if (!rejoining && !(await underLimit(store, 'join', meta.ip, 60, 3600000, now()))) {
        throw new GameError('too_many', 'Too many attempts. Try again later.');
      }
      const room = await mutate(code, (r) => {
        const t = now();
        const existing = id && r.players[id];
        if (existing) {
          existing.lastSeen = t;
          if (cleanAvatar(avatar)) existing.avatar = cleanAvatar(avatar);
          return;
        }
        if (r.phase !== 'lobby') {
          // Coming back to a game that started while they were away.
          if (rejoining) throw new GameError('left_out', 'A game started while you were away, so you’re not part of it.');
          throw new GameError('game_started', 'This game already started. Ask the host for a new room.');
        }
        // A room with a party challenge only takes players who have read and accepted it.
        if (r.challenge && acceptedChallenge !== r.challenge) {
          throw new GameError('challenge_required', 'Read and accept the room’s challenge to join.');
        }
        const n = cleanName(name);
        const online = Object.values(r.players).filter((p) => isOnline(p, t));
        if (online.length >= MAX_PLAYERS) throw new GameError('room_full', 'Room is full.');
        if (online.some((p) => p.name.toLowerCase() === n.toLowerCase())) {
          throw new GameError('name_taken', 'That name is taken in this room. Try another.');
        }
        id = id || randomId(12);
        r.players[id] = { id, name: n, avatar: cleanAvatar(avatar), totalScore: 0, joinedAt: t, lastSeen: t };
        r.lastActivity = t;
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

      const timeUp = room.phase === 'playing' && (t >= room.startedAt + room.duration + ANSWER_GRACE_MS || allFinished(room, t));
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
        if (r.finished && r.finished[playerId]) return false; // locked after "Done"
        const clean = {};
        for (const cat of r.categories) {
          const text = cleanText((answers || {})[cat.id], { max: 60 });
          if (text) clean[cat.id] = text;
        }
        r.answers[playerId] = clean;
        touch(r, playerId, t);
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
        // Only players online right now take part: anyone away leaves the room
        // (they can join again once it's back in the lobby).
        for (const p of Object.values(r.players)) {
          if (!isOnline(p, t)) {
            delete r.players[p.id];
            delete r.answers[p.id];
          }
        }
        if (!r.players[r.hostId]) r.hostId = playerId;
        if (isWordGame(r)) startWordRound(r, 'medium', t);
        else startRound(r, randomLetter(), t);
        started = true;
      });
      if (started) {
        // Count the game, and each player the first time they ever play.
        const firsts = await Promise.all(Object.keys(room.players).map((id) => stats.firstTime('player', id)));
        await stats.bump({ gamesStarted: 1, uniquePlayers: firsts.filter(Boolean).length });
        if (room.sponsor) await sponsors.bump(room.sponsor.id, { gamesStarted: 1, playersReached: Object.keys(room.players).length });
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
        if (isWordGame(r)) throw new GameError('wrong_game', 'This room plays Word Blitz.');
        const winner = r.players[r.reveal.winnerId];
        const winnerAway = !winner || !isOnline(winner, t);
        const allowed = playerId === r.reveal.winnerId || (winnerAway && playerId === effectiveHostId(r, t));
        if (!allowed) throw new GameError('winner_only', 'Only the round winner picks the next letter.');
        startRound(r, L, t);
      });
      return { room, playerId };
    },

    // Word Blitz: the player has finished — their clock stops and their
    // answers lock. The round ends once everyone online is done.
    async done({ code, playerId, round, answers }) {
      let everyoneDone = false;
      const room = await mutate(code, (r) => {
        const t = now();
        if (!isWordGame(r) || r.phase !== 'playing' || r.round !== round || !r.players[playerId]) return false;
        if (t < r.startedAt || t > r.startedAt + r.duration + ANSWER_GRACE_MS) return false;
        r.finished = r.finished || {};
        if (r.finished[playerId]) return false;
        const clean = {};
        for (const cat of r.categories) {
          const text = cleanText((answers || {})[cat.id], { max: 60 });
          if (text) clean[cat.id] = text;
        }
        r.answers[playerId] = clean;
        r.finished[playerId] = Math.min(t, r.startedAt + r.duration);
        touch(r, playerId, t);
        everyoneDone = allFinished(r, t);
      });
      return { room: everyoneDone ? await finishRound(code, round) : room, playerId };
    },

    // Word Blitz: the round winner (or the host, if they're away) picks the
    // next round's difficulty, which starts it.
    async chooseDifficulty({ code, playerId, level }) {
      if (!Object.hasOwn(DIFFICULTY_SHOWN, level)) throw new GameError('invalid_level', 'Pick a difficulty.');
      const room = await mutate(code, (r) => {
        const t = now();
        if (r.phase !== 'reveal' || !isWordGame(r)) return false;
        touch(r, playerId, t);
        if (r.reveal.final) throw new GameError('game_over', 'The game is over.');
        const winner = r.players[r.reveal.winnerId];
        const winnerAway = !winner || !isOnline(winner, t);
        const allowed = playerId === r.reveal.winnerId || (winnerAway && playerId === effectiveHostId(r, t));
        if (!allowed) throw new GameError('winner_only_level', 'Only the round winner picks the difficulty.');
        startWordRound(r, level, t);
      });
      return { room, playerId };
    },

    // One per browser session; visitorId is a random id kept on the device.
    async visit({ visitorId }, meta) {
      if (!(await underLimit(store, 'visit', meta.ip, 30, 3600000, now()))) return { room: null, playerId: null };
      const first = await stats.firstTime('visitor', visitorId);
      await stats.bump({ visits: 1, uniqueVisitors: first ? 1 : 0 });
      return { room: null, playerId: null };
    },

    async adminLogin({ password, passcode }, meta) {
      try {
        const token = await admin.login(String(password || ''), String(passcode || ''), meta.ip);
        return { room: null, playerId: null, extra: { adminToken: token } };
      } catch (err) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 400)); // slow down guessing
        if (err.code === 'admin_locked') throw new GameError('admin_locked', 'Too many attempts. Try again later.');
        throw new GameError('admin_denied', 'Wrong password or passcode.');
      }
    },

    async adminStats({ token }) {
      if (!admin.verify(token)) throw new GameError('admin_expired', 'Please sign in again.');
      return { room: null, playerId: null, extra: { dashboard: await dashboard() } };
    },

    // ---- sponsors ----

    // Live campaigns a room creator can pick for a "real prizes" game.
    async sponsorsAvailable() {
      const live = await sponsors.live();
      return { room: null, playerId: null, extra: { sponsors: live.map(publicCampaign) } };
    },

    // Public details of a campaign (logo, prize, rules) for the page.
    async sponsorInfo({ id }) {
      const c = await sponsors.get(id);
      if (!c) throw new GameError('sponsor_not_found', 'Campaign not found.');
      return { room: null, playerId: null, extra: { sponsor: publicCampaign(c) } };
    },

    // Count a click through to the sponsor's website.
    async sponsorClick({ id }, meta) {
      if ((await sponsors.get(id)) && (await underLimit(store, 'sclick', meta.ip, 30, 3600000, now()))) {
        await sponsors.bump(id, { clicks: 1 });
      }
      return { room: null, playerId: null, extra: { ok: true } };
    },

    // Winner leaves the details the campaign asks for (with consent) so the
    // sponsor can hand over the prize.
    async claimPrize({ code, playerId, details, email, consent }) {
      const loaded = await load(code);
      if (!loaded) throw new GameError('room_not_found', 'Room not found. Check the code.');
      // Older pages only send an email; rooms from before winner details
      // were added only ever asked for one.
      const input = details && typeof details === 'object' ? details : { email };
      const fields = loaded.room.sponsor && loaded.room.sponsor.winnerFields ? loaded.room.sponsor.winnerFields : ['email'];
      const clean = await sponsorCall(async () => cleanWinnerDetails(fields, input));
      if (!consent) throw new GameError('need_consent', 'Please tick the box to agree.');
      const room = await mutate(code, (r) => {
        const prize = r.prizes && isPlayerId(playerId) && Object.hasOwn(r.prizes, playerId) ? r.prizes[playerId] : null;
        if (!prize || prize.skipped) throw new GameError('no_prize', 'No prize to claim.');
        if (prize.emailSaved) return false;
        touch(r, playerId, now());
        prize.emailSaved = true;
        prize.pendingDetails = clean;
      });
      const prize = room.prizes[playerId];
      if (!prize.pendingDetails) return { room, playerId };
      await sponsors.addDetails(prize.claimKey, prize.pendingDetails);
      const updated = await mutate(code, (r) => {
        delete r.prizes[playerId].pendingDetails;
      });
      return { room: updated, playerId };
    },

    // The winner is filling in their details: keep the room locked for them
    // (until they've been idle for PRIZE_LOCK_MS; once unlocked it stays so).
    async prizeActivity({ code, playerId }) {
      const room = await mutate(code, (r) => {
        const t = now();
        if (!pendingWinners(r).includes(playerId)) return false;
        touch(r, playerId, t);
        // Once the room has been handed back to the owner it stays so.
        if (t < (r.prizeLockUntil || 0)) r.prizeLockUntil = t + PRIZE_LOCK_MS;
      });
      return { room, playerId };
    },

    // The winner doesn't want the prize: the code goes back for another
    // winner, and they can still win one later in the campaign.
    async skipPrize({ code, playerId }) {
      let skipped = null;
      const room = await mutate(code, (r) => {
        const prize = r.prizes && isPlayerId(playerId) && Object.hasOwn(r.prizes, playerId) ? r.prizes[playerId] : null;
        if (!prize || prize.skipped || prize.emailSaved) return false;
        touch(r, playerId, now());
        prize.skipped = true;
        skipped = { ...prize };
      });
      if (skipped && room.sponsor) await sponsors.releasePrize(room.sponsor.id, playerId, skipped.claimKey, skipped.code);
      return { room, playerId };
    },

    async adminSponsors({ token }) {
      if (!admin.verify(token)) throw new GameError('admin_expired', 'Please sign in again.');
      const list = await sponsors.list();
      const reports = await Promise.all(list.map((c) => sponsors.report(c.id)));
      return { room: null, playerId: null, extra: { campaigns: list.map((c, i) => ({ ...c, report: reports[i] })) } };
    },

    async adminSponsorSave({ token, campaign, addCodes }) {
      if (!admin.verify(token)) throw new GameError('admin_expired', 'Please sign in again.');
      const saved = await sponsorCall(() => sponsors.save(campaign || {}, addCodes));
      return { room: null, playerId: null, extra: { campaign: saved } };
    },

    async adminSponsorDelete({ token, id }) {
      if (!admin.verify(token)) throw new GameError('admin_expired', 'Please sign in again.');
      if (await sponsors.get(id)) await sponsors.remove(id);
      return { room: null, playerId: null, extra: { ok: true } };
    },

    // Rating after the last round or on leaving a room.
    async feedback(body, meta) {
      await inboxCall(() => inbox.addFeedback({ ...body, roomCode: body.code }, meta.ip));
      return { room: null, playerId: null, extra: { ok: true } };
    },

    // "Contact us" form.
    async contact(body, meta) {
      await inboxCall(() => inbox.addMessage(body, meta.ip));
      return { room: null, playerId: null, extra: { ok: true } };
    },

    async adminDeleteItem({ token, id }) {
      if (!admin.verify(token)) throw new GameError('admin_expired', 'Please sign in again.');
      await inbox.deleteItem(id);
      return { room: null, playerId: null, extra: { dashboard: await dashboard() } };
    },

    // CSV exports: 'daily' | 'rooms' | 'players' | 'totals' | 'feedback' | 'messages'
    // | 'claims' | 'answers' | 'answerSummary' (the last three per campaign, or all).
    async adminCsv({ token, dataset, campaignId }) {
      if (!admin.verify(token)) throw new GameError('admin_expired', 'Please sign in again.');
      const t = now();
      const stamp = new Date(t).toISOString().slice(0, 10);
      let csv;
      if (dataset === 'daily') csv = dailyCsv(await stats.get());
      else if (dataset === 'totals') csv = totalsCsv(await stats.get(), await dashboard());
      else if (dataset === 'rooms' || dataset === 'players') {
        const rooms = [...(await currentRoomSummaries(t)), ...(await listArchive(store))];
        csv = dataset === 'rooms' ? roomsCsv(rooms) : playersCsv(rooms);
      } else if (dataset === 'feedback') csv = feedbackCsv(await inbox.listFeedback());
      else if (dataset === 'messages') csv = messagesCsv(await inbox.listMessages());
      else if (dataset === 'claims') csv = claimsCsv(await sponsors.claims(campaignId));
      else if (dataset === 'answers') csv = sponsorAnswersCsv(await sponsors.answers(campaignId));
      else if (dataset === 'answerSummary') csv = sponsorAnswerSummaryCsv(await sponsors.answers(campaignId));
      else throw new GameError('bad_dataset', 'Unknown export.');
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
      else if (dataset === 'feedback') deleted = await inbox.deleteFeedbackBefore(cutoff);
      else if (dataset === 'messages') deleted = await inbox.deleteMessagesBefore(cutoff);
      else throw new GameError('bad_dataset', 'Unknown data.');
      return { room: null, playerId: null, extra: { deleted, dashboard: await dashboard() } };
    },

    // Check a room exists and is open without joining it (invite links, and
    // before joining, to show the room’s challenge).
    async peek({ code }, meta) {
      if (!(await underLimit(store, 'peek', meta.ip, 120, 3600000, now()))) {
        throw new GameError('too_many', 'Too many attempts. Try again later.');
      }
      const loaded = await load(code);
      if (!loaded) throw new GameError('room_not_found', 'Room not found. Check the code.');
      // The challenge is shown to a player before they join.
      const open = loaded.room.phase === 'lobby';
      return { room: null, playerId: null, extra: { open, challenge: open ? loaded.room.challenge || '' : '' } };
    },

    // "Keep it open": a player online answers the inactivity warning.
    async keepAlive({ code, playerId }) {
      const room = await mutate(code, (r) => {
        if (!r.players[playerId]) throw new GameError('not_in_room', 'You are no longer in this room.');
        touch(r, playerId, now());
      });
      return { room, playerId };
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
        if (prizeLocked(r, t)) throw new GameError('prize_pending', 'A winner is still claiming or skipping their prize.');
        r.phase = 'lobby';
        r.round = 0;
        r.letter = null;
        r.categories = [];
        r.startedAt = null;
        r.answers = {};
        r.reveal = null;
        r.prizeResult = null;
        r.prizes = null;
        r.prizeLockUntil = 0;
        r.finished = {};
        for (const p of Object.values(r.players)) {
          p.totalScore = 0;
          p.totalTime = 0;
        }
      });
      return { room, playerId };
    },

    // The crown's owner leaving must choose: close the room for everyone, or
    // hand the crown to another player for good (alone, the room closes).
    // Anyone else — including someone only holding the crown while the owner
    // is away — just leaves.
    async leave({ code, playerId, closeRoom, newHostId }) {
      await mutate(code, (r) => {
        if (!r.players[playerId]) return false;
        const isHost = playerId === r.hostId;
        const alone = Object.keys(r.players).length === 1;
        if (isHost && closeRoom && !alone && prizeLocked(r, now()) && pendingWinners(r).some((id) => id !== playerId)) {
          throw new GameError('prize_pending', 'A winner is still claiming or skipping their prize.');
        }
        if (isHost && (closeRoom || alone)) {
          r.closed = true;
          return;
        }
        if (isHost && !newHostId) {
          throw new GameError('host_must_choose', 'Give the crown to another player or close the room.');
        }
        if (isHost) {
          if (newHostId === playerId || !isPlayerId(newHostId) || !Object.hasOwn(r.players, newHostId)) {
            throw new GameError('invalid_new_host', 'Pick a player who is still in the room.');
          }
          r.hostId = newHostId;
        }
        delete r.players[playerId];
        delete r.answers[playerId];
      }).catch((err) => {
        if (err instanceof GameError && ['invalid_new_host', 'host_must_choose', 'prize_pending'].includes(err.code)) throw err;
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
        const closed = r.closed || isAbandoned(r, t);
        const live = !closed && Object.values(r.players).some((p) => isOnline(p, t));
        return roomSummary(r, closed ? 'closed' : live ? 'live' : 'open', t);
      });
  }

  // Everything the admin dashboard shows. Also moves rooms past their
  // 6-hour lifetime into the archive.
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
        if (!r || t - r.createdAt > ROOM_TTL_MS || r.closed || isAbandoned(r, t)) continue;
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
    const [feedback, messages] = await Promise.all([inbox.listFeedback(), inbox.listMessages()]);
    return {
      feedback,
      messages,
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
    const fn = Object.hasOwn(actions, action) ? actions[action] : null;
    if (!fn) throw new GameError('unknown_action', 'Unknown action.');
    const code = String(body.code || '').trim().toUpperCase();
    const payload = {
      ...body,
      code: isRoomCode(code) ? code : '',
      playerId: isPlayerId(body.playerId) ? body.playerId : undefined,
    };
    const { room, playerId, extra } = await fn(payload, meta);
    const t = now();
    return { now: t, playerId, state: room ? publicState(room, playerId, t) : null, ...extra };
  };
}
