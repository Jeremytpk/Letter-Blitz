import { getStore } from '@netlify/blobs';
import { createGame, GameError } from '../lib/game.mjs';
import { adminConfig } from '../lib/admin.mjs';

export default async (req, context) => {
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Bad request.' }, { status: 400 });
  }

  const store = getStore({ name: 'letter-blitz', consistency: 'strong' });
  const handle = createGame(store, { adminCfg: adminConfig(process.env) });
  try {
    return Response.json(await handle(body.action, body, { ip: context && context.ip }));
  } catch (err) {
    if (err instanceof GameError) {
      return Response.json({ error: err.message, errorCode: err.code, now: Date.now() }, { status: 400 });
    }
    console.error(err);
    return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
};

export const config = { path: '/api/game' };
