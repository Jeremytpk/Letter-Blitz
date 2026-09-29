import { getStore } from '@netlify/blobs';
import { createGame, GameError } from '../lib/game.mjs';
import { adminConfig } from '../lib/admin.mjs';
import { createMeaningGrader } from '../lib/meaning-grade.mjs';
import { MAX_ADMIN_BODY_BYTES, MAX_BODY_BYTES, originAllowed, tooManyRequests } from '../lib/security.mjs';

// API responses are never cached and never reinterpreted by the browser.
const HEADERS = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const reply = (body, status = 200) => Response.json(body, { status, headers: HEADERS });

export default async (req, context) => {
  if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);
  if (!originAllowed(req.headers.get('origin'))) return reply({ error: 'Forbidden', errorCode: 'forbidden' }, 403);

  const ip = context && context.ip;
  if (tooManyRequests(ip)) return reply({ error: 'Too many requests. Slow down.', errorCode: 'too_many', now: Date.now() }, 429);

  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > MAX_ADMIN_BODY_BYTES) return reply({ error: 'Request too large.' }, 413);
  let body;
  try {
    const text = await req.text();
    if (text.length > MAX_ADMIN_BODY_BYTES) return reply({ error: 'Request too large.' }, 413);
    body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('not an object');
    // Only admin actions may be large (they still need a valid admin token).
    if (text.length > MAX_BODY_BYTES && !String(body.action || '').startsWith('admin')) {
      return reply({ error: 'Request too large.' }, 413);
    }
  } catch {
    return reply({ error: 'Bad request.' }, 400);
  }

  const store = getStore({ name: 'letter-blitz', consistency: 'strong' });
  const handle = createGame(store, { adminCfg: adminConfig(process.env), gradeMeanings: createMeaningGrader(process.env) });
  try {
    return reply(await handle(String(body.action || ''), body, { ip }));
  } catch (err) {
    if (err instanceof GameError) {
      return reply({ error: err.message, errorCode: err.code, now: Date.now() }, err.code === 'too_many' ? 429 : 400);
    }
    console.error(err);
    return reply({ error: 'Something went wrong. Try again.' }, 500);
  }
};

export const config = { path: '/api/game' };
