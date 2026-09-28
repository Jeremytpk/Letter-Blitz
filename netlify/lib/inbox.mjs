// ---------------------------------------------------------------------------
// Player feedback and contact messages.
//
// Each one is its own small document ("feedback-…" / "message-…"), shown on
// the admin dashboard and saved to admin-data/ by `npm run export-data`.
// Nothing here is deleted automatically — only the admin can.
// ---------------------------------------------------------------------------

import { randomBytes } from 'node:crypto';
import { cleanText, ipTag } from './security.mjs';

export const FEEDBACK_PREFIX = 'feedback-';
export const MESSAGE_PREFIX = 'message-';

// Per network address and hour, to stop floods.
const LIMITS = { feedback: 10, message: 5 };

const clip = (v, max) => cleanText(v, { max, singleLine: false });
const oneLine = (v, max) => cleanText(v, { max });
const newKey = (prefix, t) => `${prefix}${new Date(t).toISOString().slice(0, 10)}-${t}-${randomBytes(3).toString('hex')}`;

export class InboxError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function createInbox(store, now = () => Date.now()) {
  async function underLimit(kind, ip) {
    const t = now();
    const key = `rate-${kind}-${ipTag(ip)}-${Math.floor(t / 3600000)}`;
    const res = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    const count = (res && res.data && res.data.count) || 0;
    if (count >= LIMITS[kind]) return false;
    await store.setJSON(key, { count: count + 1 });
    return true;
  }

  async function list(prefix) {
    const { blobs } = await store.list({ prefix });
    const out = [];
    for (let i = 0; i < blobs.length; i += 25) {
      const batch = await Promise.all(blobs.slice(i, i + 25).map((b) => store.get(b.key, { type: 'json' }).then((d) => d && { id: b.key, ...d })));
      out.push(...batch.filter(Boolean));
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  }

  async function removeBefore(prefix, before) {
    const { blobs } = await store.list({ prefix });
    const doomed = blobs.filter((b) => !before || b.key.slice(prefix.length, prefix.length + 10) < before);
    for (let i = 0; i < doomed.length; i += 25) await Promise.all(doomed.slice(i, i + 25).map((b) => store.delete(b.key)));
    return doomed.length;
  }

  return {
    // Rating 1–5 with an optional comment, given at game over or on leaving.
    async addFeedback({ rating, comment, context, name, avatar, roomCode, lang }, ip) {
      const r = Math.round(Number(rating));
      if (!(r >= 1 && r <= 5)) throw new InboxError('bad_rating', 'Pick a rating from 1 to 5.');
      if (!(await underLimit('feedback', ip))) throw new InboxError('too_many', 'Too many messages. Try again later.');
      const t = now();
      const item = {
        createdAt: t,
        rating: r,
        comment: clip(comment, 1000).trim(),
        context: context === 'leave' ? 'leave' : 'game_over',
        name: oneLine(name, 20),
        avatar: /^[A-Za-z][A-Za-z0-9_-]{1,23}$/.test(String(avatar || '')) ? avatar : '',
        roomCode: /^[A-Z0-9]{4}$/.test(String(roomCode || '')) ? roomCode : '',
        lang: lang === 'fr' ? 'fr' : 'en',
      };
      await store.setJSON(newKey(FEEDBACK_PREFIX, t), item);
      return item;
    },

    // "Contact us" form. `website` is a hidden field only bots fill in.
    async addMessage({ name, email, message, lang, website }, ip) {
      const text = clip(message, 3000).trim();
      if (website) return null; // quietly drop bot submissions
      if (text.length < 2) throw new InboxError('empty_message', 'Please write a message.');
      const mail = oneLine(email, 200);
      if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw new InboxError('bad_email', 'That email address doesn’t look right.');
      if (!(await underLimit('message', ip))) throw new InboxError('too_many', 'Too many messages. Try again later.');
      const t = now();
      const item = { createdAt: t, name: oneLine(name, 60), email: mail, message: text, lang: lang === 'fr' ? 'fr' : 'en' };
      await store.setJSON(newKey(MESSAGE_PREFIX, t), item);
      return item;
    },

    listFeedback: () => list(FEEDBACK_PREFIX),
    listMessages: () => list(MESSAGE_PREFIX),
    deleteFeedbackBefore: (before) => removeBefore(FEEDBACK_PREFIX, before),
    deleteMessagesBefore: (before) => removeBefore(MESSAGE_PREFIX, before),

    // Delete one item by id (admin).
    async deleteItem(id) {
      if (!String(id).startsWith(FEEDBACK_PREFIX) && !String(id).startsWith(MESSAGE_PREFIX)) return false;
      await store.delete(id);
      return true;
    },
  };
}
