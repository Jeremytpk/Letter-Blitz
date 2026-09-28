// ---------------------------------------------------------------------------
// Request guards for the game API: where requests may come from, how big and
// how frequent they may be, and what ids and text are allowed through.
// ---------------------------------------------------------------------------

import { createHash } from 'node:crypto';

export const MAX_BODY_BYTES = 16 * 1024;

// Browsers always send Origin on POST. Requests from other websites are
// refused (cross-site request forgery); tools without Origin (the export
// script) are allowed and still need the admin password for anything private.
const ALLOWED_ORIGINS = [
  /^https:\/\/letterblitz\.world$/,
  /^https:\/\/www\.letterblitz\.world$/,
  /^https:\/\/letterblitz\.netlify\.app$/,
  /^https:\/\/[a-z0-9-]+--letterblitz\.netlify\.app$/, // Netlify deploy previews
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/, // local testing
];

export function originAllowed(origin) {
  return !origin || ALLOWED_ORIGINS.some((re) => re.test(origin));
}

// Per-address request cap kept in memory by each running copy of the
// function — a cheap first line of defence against floods. A player polls
// about once a second, so this leaves plenty of room for normal play.
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 240;
const hits = new Map();

export function tooManyRequests(ip, now = Date.now()) {
  const key = ip || 'unknown';
  const entry = hits.get(key);
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(key, { start: now, count: 1 });
    if (hits.size > 5000) for (const [k, v] of hits) if (now - v.start > WINDOW_MS) hits.delete(k);
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export const ipTag = (ip) => createHash('sha256').update(String(ip || 'unknown')).digest('hex').slice(0, 16);

// Shared limit across all copies of the function, stored with the game data:
// at most `max` of `kind` per address per window.
export async function underLimit(store, kind, ip, max, windowMs, now = Date.now()) {
  const key = `rate-${kind}-${ipTag(ip)}-${Math.floor(now / windowMs)}`;
  try {
    const res = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    const count = (res && res.data && res.data.count) || 0;
    if (count >= max) return false;
    await store.setJSON(key, { count: count + 1 });
  } catch (err) {
    console.warn('Rate limit check failed:', err.message);
  }
  return true;
}

// ---- ids and text ----------------------------------------------------------

export const isRoomCode = (code) => /^[A-Z0-9]{4}$/.test(String(code || ''));
export const isPlayerId = (id) => /^[a-z0-9-]{6,48}$/i.test(String(id || ''));

// Control characters, zero-width characters and text-direction overrides let
// people fake names ("‮nimda") or break layouts; drop them.
const INVISIBLE = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;

export function cleanText(value, { max, singleLine = true } = {}) {
  let s = String(value === undefined || value === null ? '' : value).normalize('NFC');
  s = singleLine ? s.replace(INVISIBLE, '').replace(/\s+/g, ' ') : s.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f​-‏‪-‮⁠-⁤⁦-⁩﻿]/g, '');
  s = s.trim();
  return max ? s.slice(0, max) : s;
}
