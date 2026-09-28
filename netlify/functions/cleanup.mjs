import { getStore } from '@netlify/blobs';
import { deleteExpiredRooms } from '../lib/game.mjs';

// Every hour: rooms older than 6 hours leave the game; a summary of each is
// kept in the admin archive (only the admin deletes it). See the Privacy page.
export default async () => {
  const store = getStore({ name: 'letter-blitz', consistency: 'strong' });
  const deleted = await deleteExpiredRooms(store);
  console.log(`Archived ${deleted} expired room(s)`);
};

export const config = { schedule: '@hourly' };
