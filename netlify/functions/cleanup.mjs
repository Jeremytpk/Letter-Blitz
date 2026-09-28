import { getStore } from '@netlify/blobs';
import { deleteExpiredRooms } from '../lib/game.mjs';

// Every hour: delete rooms older than 12 hours (see the Privacy page).
export default async () => {
  const store = getStore({ name: 'letter-blitz', consistency: 'strong' });
  const deleted = await deleteExpiredRooms(store);
  console.log(`Deleted ${deleted} expired room(s)`);
};

export const config = { schedule: '@hourly' };
