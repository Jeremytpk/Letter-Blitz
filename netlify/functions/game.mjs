import { getStore } from '@netlify/blobs';
import { createGame, GameError } from '../lib/game.mjs';

export default async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Bad request.' }, { status: 400 });
  }

  const store = getStore({ name: 'letter-blitz', consistency: 'strong' });
  const handle = createGame(store);
  try {
    return Response.json(await handle(body.action, body));
  } catch (err) {
    if (err instanceof GameError) return Response.json({ error: err.message, now: Date.now() }, { status: 400 });
    console.error(err);
    return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
};

export const config = { path: '/api/game' };
