// ---------------------------------------------------------------------------
// Admin archive and exports.
//
// When a room reaches the end of its 6-hour life, a summary of it (code,
// dates, rounds, and each player's name, avatar and score — not their
// answers) is kept here for the admin. Nothing in the archive or the
// statistics is ever deleted automatically: only the admin can, from the
// dashboard or with `npm run export-data -- --delete-after`.
// ---------------------------------------------------------------------------

const ARCHIVE_PREFIX = 'archive-room-';

export function roomSummary(r, status, now) {
  const players = Object.values(r.players || {}).sort((a, b) => a.joinedAt - b.joinedAt);
  return {
    code: r.code,
    createdAt: r.createdAt,
    archivedAt: now,
    status, // 'closed' | 'expired'
    totalRounds: r.totalRounds || 5,
    roundsPlayed: r.round || 0,
    hostName: (r.players && r.players[r.hostId] && r.players[r.hostId].name) || '',
    players: players.map((p) => ({
      name: p.name,
      avatar: p.avatar || '',
      score: p.totalScore || 0,
      host: p.id === r.hostId,
      joinedAt: p.joinedAt,
    })),
  };
}

const archiveKey = (r) => `${ARCHIVE_PREFIX}${new Date(r.createdAt).toISOString().slice(0, 10)}-${r.createdAt}-${r.code}`;

export async function archiveRoom(store, r, now) {
  await store.setJSON(archiveKey(r), roomSummary(r, r.closed ? 'closed' : 'expired', now));
}

export async function listArchive(store) {
  const { blobs } = await store.list({ prefix: ARCHIVE_PREFIX });
  const out = [];
  for (let i = 0; i < blobs.length; i += 25) {
    const batch = await Promise.all(blobs.slice(i, i + 25).map((b) => store.get(b.key, { type: 'json' }).then((d) => d && { key: b.key, ...d })));
    out.push(...batch.filter(Boolean));
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

// Delete archived rooms created before `before` ('YYYY-MM-DD'), or all of them.
export async function deleteArchive(store, before) {
  const { blobs } = await store.list({ prefix: ARCHIVE_PREFIX });
  const doomed = blobs.filter((b) => !before || b.key.slice(ARCHIVE_PREFIX.length, ARCHIVE_PREFIX.length + 10) < before);
  for (let i = 0; i < doomed.length; i += 25) await Promise.all(doomed.slice(i, i + 25).map((b) => store.delete(b.key)));
  return doomed.length;
}

// ---- CSV -----------------------------------------------------------------

const cell = (v) => {
  let s = v === null || v === undefined ? '' : String(v);
  // Text starting with = + - @ would run as a formula in Excel/Sheets
  // (CSV injection); a leading apostrophe keeps it as plain text.
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
// Leading BOM so Excel opens accents (é, ç…) correctly.
const toCsv = (header, rows) => '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
const iso = (t) => (t ? new Date(t).toISOString() : '');
const minutes = (ms) => Math.round((ms || 0) / 60000);

export function dailyCsv(stats) {
  const days = Object.keys(stats.days || {}).sort();
  return toCsv(
    ['date', 'visits', 'unique_visitors', 'rooms_created', 'games_started', 'rounds_played', 'new_players', 'time_played_minutes'],
    days.map((d) => {
      const v = stats.days[d];
      return [d, v.visits || 0, v.uniqueVisitors || 0, v.roomsCreated || 0, v.gamesStarted || 0, v.roundsPlayed || 0, v.uniquePlayers || 0, minutes(v.playerMs)];
    })
  );
}

// `rooms` = archived summaries plus live rooms (status 'live' / 'open').
export function roomsCsv(rooms) {
  return toCsv(
    ['room_code', 'created_at', 'status', 'total_rounds', 'rounds_played', 'players_count', 'host', 'winner', 'top_score', 'players'],
    rooms.map((r) => {
      const best = [...r.players].sort((a, b) => b.score - a.score)[0];
      return [r.code, iso(r.createdAt), r.status, r.totalRounds, r.roundsPlayed, r.players.length, r.hostName, best ? best.name : '', best ? best.score : '', r.players.map((p) => p.name).join('; ')];
    })
  );
}

export function playersCsv(rooms) {
  const rows = [];
  for (const r of rooms) {
    for (const p of r.players) rows.push([r.code, iso(r.createdAt), r.status, p.name, p.avatar, p.score, p.host ? 'yes' : 'no', iso(p.joinedAt)]);
  }
  return toCsv(['room_code', 'room_created_at', 'room_status', 'player_name', 'avatar', 'score', 'host', 'joined_at'], rows);
}

export function totalsCsv(stats, snapshot) {
  return toCsv(
    ['metric', 'value'],
    [
      ['visits', stats.visits],
      ['unique_visitors', stats.uniqueVisitors],
      ['people_who_played', stats.uniquePlayers],
      ['rooms_created', stats.roomsCreated],
      ['games_started', stats.gamesStarted],
      ['rounds_played', stats.roundsPlayed],
      ['time_played_minutes_all_players', minutes(stats.playerMs)],
      ['time_played_minutes_rooms', minutes(stats.roomMs)],
      ['rooms_online_now', snapshot.roomsOnline],
      ['players_online_now', snapshot.playersOnline],
      ['exported_at', iso(snapshot.generatedAt)],
    ]
  );
}

export function feedbackCsv(items) {
  return toCsv(
    ['id', 'created_at', 'rating', 'comment', 'when', 'player_name', 'avatar', 'room_code', 'language'],
    items.map((f) => [f.id, iso(f.createdAt), f.rating, f.comment, f.context, f.name, f.avatar, f.roomCode, f.lang])
  );
}

export function messagesCsv(items) {
  return toCsv(
    ['id', 'created_at', 'name', 'email', 'message', 'language'],
    items.map((m) => [m.id, iso(m.createdAt), m.name, m.email, m.message, m.lang])
  );
}

export function claimsCsv(items) {
  return toCsv(
    ['campaign', 'awarded_at', 'prize_code', 'code_status', 'player_name', 'avatar', 'score', 'room_code', 'full_name', 'email', 'phone', 'address', 'consent', 'details_sent_at'],
    items.map((c) => [
      c.campaignName, iso(c.createdAt), c.code,
      // A code is only valid once its winner has sent their details.
      c.skipped ? 'skipped by winner' : c.detailsNeeded === false || c.detailsAt || c.emailAt ? 'active' : 'waiting for winner details',
      c.playerName, c.avatar, c.score, c.roomCode,
      c.fullName || '', c.email || '', c.phone || '', c.address || '', c.consent ? 'yes' : 'no', iso(c.detailsAt || c.emailAt),
    ])
  );
}

// Answers given in a sponsor's category (no player names).
const checked = (v) => (v === true ? 'yes' : v === false ? 'no' : 'not checked');

export function sponsorAnswersCsv(items) {
  return toCsv(
    ['id', 'campaign', 'category', 'answered_at', 'room_code', 'round', 'letter', 'answer', 'right_letter', 'found_online', 'points'],
    items.map((a) => [a.id, a.campaign, a.category, iso(a.at), a.roomCode, a.round, a.letter, a.text, a.valid ? 'yes' : 'no', checked(a.exists), a.points])
  );
}

// The same answers grouped: how often each one was given, per campaign and category.
export function sponsorAnswerSummaryCsv(items) {
  const simple = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const groups = new Map();
  const totals = new Map();
  for (const a of items) {
    const scope = `${a.campaign}|${a.category}`;
    totals.set(scope, (totals.get(scope) || 0) + 1);
    const key = `${scope}|${simple(a.text)}`;
    let g = groups.get(key);
    if (!g) groups.set(key, (g = { campaign: a.campaign, category: a.category, scope, spellings: new Map(), count: 0, rooms: new Set(), notFound: 0, first: a.at, last: a.at }));
    g.count += 1;
    g.spellings.set(a.text, (g.spellings.get(a.text) || 0) + 1);
    g.rooms.add(`${a.roomCode}`);
    if (a.exists === false) g.notFound += 1;
    g.first = Math.min(g.first, a.at);
    g.last = Math.max(g.last, a.at);
  }
  const rows = [...groups.values()].sort((a, b) => a.scope.localeCompare(b.scope) || b.count - a.count);
  return toCsv(
    ['campaign', 'category', 'answer', 'times_given', 'share_percent', 'rooms', 'not_found_online', 'first_given', 'last_given'],
    rows.map((g) => {
      const answer = [...g.spellings].sort((a, b) => b[1] - a[1])[0][0];
      const share = Math.round((1000 * g.count) / totals.get(g.scope)) / 10;
      return [g.campaign, g.category, answer, g.count, share, g.rooms.size, g.notFound, iso(g.first), iso(g.last)];
    })
  );
}
