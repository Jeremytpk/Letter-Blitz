// ---------------------------------------------------------------------------
// Site statistics for the admin dashboard.
//
// One JSON document ("stats") holds running totals plus per-day counts.
// Nothing is deleted automatically — only the admin can clear old days.
// Uniqueness (visitors, players) is tracked with one tiny marker document
// per id, written only if it doesn't exist yet.
// Counting must never break the game, so every failure is swallowed.
// ---------------------------------------------------------------------------

const STATS_KEY = 'stats';

export const EMPTY_STATS = {
  visits: 0,
  uniqueVisitors: 0,
  roomsCreated: 0,
  gamesStarted: 0,
  roundsPlayed: 0,
  uniquePlayers: 0,
  playerMs: 0, // time spent in rounds, summed over every player
  roomMs: 0, // time spent in rounds, summed over rooms
  days: {}, // 'YYYY-MM-DD' -> { visits, uniqueVisitors, roomsCreated, gamesStarted, roundsPlayed, playerMs }
};

const dayKey = (t) => new Date(t).toISOString().slice(0, 10);

export function createStats(store, now = () => Date.now()) {
  async function read() {
    const res = await store.getWithMetadata(STATS_KEY, { type: 'json', consistency: 'strong' });
    return { data: { ...EMPTY_STATS, ...(res && res.data), days: { ...((res && res.data && res.data.days) || {}) } }, etag: res && res.etag };
  }

  // Add to totals and today's numbers, e.g. bump({ visits: 1 }).
  async function bump(deltas) {
    try {
      for (let attempt = 0; attempt < 8; attempt++) {
        const { data, etag } = await read();
        const day = dayKey(now());
        const today = { ...(data.days[day] || {}) };
        for (const [k, v] of Object.entries(deltas)) {
          data[k] = (data[k] || 0) + v;
          today[k] = (today[k] || 0) + v;
        }
        data.days[day] = today;
        const write = etag
          ? await store.setJSON(STATS_KEY, data, { onlyIfMatch: etag })
          : await store.setJSON(STATS_KEY, data, { onlyIfNew: true });
        if (write.modified) return;
        await new Promise((r) => setTimeout(r, 20 + Math.random() * 80 * (attempt + 1)));
      }
    } catch (err) {
      console.warn('Stats update failed:', err.message);
    }
  }

  // True the first time an id is seen for this kind (e.g. 'visitor', 'player').
  async function firstTime(kind, id) {
    if (!/^[a-z0-9]{6,40}$/i.test(String(id || ''))) return false;
    try {
      const write = await store.setJSON(`seen-${kind}-${id}`, { t: now() }, { onlyIfNew: true });
      return write.modified;
    } catch {
      return false;
    }
  }

  // Admin only: drop daily history before 'YYYY-MM-DD' (or all of it).
  // Running totals are kept.
  async function deleteDays(before) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const { data, etag } = await read();
      const doomed = Object.keys(data.days).filter((d) => !before || d < before);
      for (const d of doomed) delete data.days[d];
      if (!etag) return 0;
      const write = await store.setJSON(STATS_KEY, data, { onlyIfMatch: etag });
      if (write.modified) return doomed.length;
    }
    throw new Error('Stats busy');
  }

  return {
    bump,
    firstTime,
    deleteDays,
    async get() {
      return (await read()).data;
    },
  };
}
