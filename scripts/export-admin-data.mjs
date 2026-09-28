// Save all admin data from the live site into this project (admin-data/).
//
//   npm run export-data                    save everything
//   npm run export-data -- --delete-after  save, then free up space online by
//                                          deleting archived rooms and daily
//                                          history older than today
//
// Signs in with ADMIN_PASSWORD / ADMIN_PASSCODE from the local .env file.
// Each run writes a dated snapshot folder, and merges rooms, players and daily
// stats into running files (admin-data/all-*.csv), so nothing is lost after
// the online copy is deleted. admin-data/ is ignored by git (it holds player
// names), so it stays on this computer.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('admin-data/', ROOT);

function loadEnv() {
  const file = new URL('.env', ROOT);
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_][A-Z0-9_]*=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
  );
}

const env = { ...loadEnv(), ...process.env };
const SITE = (env.SITE_URL || 'https://letterblitz.netlify.app').replace(/\/$/, '');
const deleteAfter = process.argv.includes('--delete-after');

async function call(action, body = {}) {
  const res = await fetch(`${SITE}/api/game`, { method: 'POST', body: JSON.stringify({ action, ...body }) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${action}: ${data.error || res.status}`);
  return data;
}

// --- tiny CSV reader for merging (handles quotes, commas, newlines) ---------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') row.push(cell), (cell = '');
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell), rows.push(row), (row = []), (cell = '');
    } else cell += c;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows.filter((r) => r.length > 1 || r[0]);
}
const cellOut = (s) => (/[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const writeCsv = (file, rows) => writeFileSync(file, '﻿' + rows.map((r) => r.map(cellOut).join(',')).join('\r\n') + '\r\n');

// Merge a fresh export into a running file; newer rows replace older ones
// with the same key.
function mergeInto(file, freshCsv, keyCols) {
  const fresh = parseCsv(freshCsv);
  const header = fresh[0];
  const keyIdx = keyCols.map((k) => header.indexOf(k));
  const key = (r) => keyIdx.map((i) => r[i]).join('|');
  const merged = new Map();
  if (existsSync(file)) {
    const old = parseCsv(readFileSync(file, 'utf8'));
    for (const r of old.slice(1)) merged.set(key(r), r);
  }
  for (const r of fresh.slice(1)) merged.set(key(r), r);
  writeCsv(file, [header, ...merged.values()]);
  return merged.size;
}

async function main() {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_PASSCODE) {
    throw new Error('ADMIN_PASSWORD and ADMIN_PASSCODE are missing from .env');
  }
  console.log(`Signing in to ${SITE}…`);
  const { adminToken: token } = await call('adminLogin', { password: env.ADMIN_PASSWORD, passcode: env.ADMIN_PASSCODE });

  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const dir = new URL(`${stamp}/`, OUT);
  mkdirSync(dir, { recursive: true });

  const { dashboard } = await call('adminStats', { token });
  writeFileSync(new URL('dashboard.json', dir), JSON.stringify(dashboard, null, 2));

  const files = {};
  for (const dataset of ['totals', 'daily', 'rooms', 'players']) {
    const { csv } = await call('adminCsv', { token, dataset });
    writeFileSync(new URL(`${dataset}.csv`, dir), csv);
    files[dataset] = csv;
  }
  console.log(`Saved snapshot: admin-data/${stamp}/ (dashboard.json, totals, daily, rooms, players)`);

  const counts = {
    daily: mergeInto(new URL('all-daily-stats.csv', OUT), files.daily, ['date']),
    rooms: mergeInto(new URL('all-rooms.csv', OUT), files.rooms, ['room_code', 'created_at']),
    players: mergeInto(new URL('all-players.csv', OUT), files.players, ['room_code', 'room_created_at', 'player_name', 'joined_at']),
  };
  writeFileSync(new URL('latest-totals.csv', OUT), files.totals);
  console.log(`Running files: all-daily-stats.csv (${counts.daily} days), all-rooms.csv (${counts.rooms} rooms), all-players.csv (${counts.players} rows)`);

  if (deleteAfter) {
    const today = new Date().toISOString().slice(0, 10);
    const a = await call('adminDelete', { token, dataset: 'archive', before: today });
    const d = await call('adminDelete', { token, dataset: 'days', before: today });
    console.log(`Freed space online: deleted ${a.deleted} archived room(s) and ${d.deleted} day(s) of history from before ${today}. Totals kept.`);
  }
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
