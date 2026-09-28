// ---------------------------------------------------------------------------
// Admin: sign-in and dashboard data.
//
// Everything secret comes from environment variables set in Netlify (never
// from the code or the repository):
//   ADMIN_NAME, ADMIN_AVATAR   — the player name + avatar that open the sign-in
//   ADMIN_PASSWORD, ADMIN_PASSCODE
// If any is missing, the admin area is simply switched off.
// ---------------------------------------------------------------------------

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
// Failed attempts are counted per network address, so a stranger guessing
// wrong can't lock the owner out.
const attemptsKey = (ip) => `admin-attempts-${digest(ip || 'unknown').toString('hex').slice(0, 24)}`;

export function adminConfig(env) {
  const cfg = {
    name: (env.ADMIN_NAME || '').trim().toLowerCase(),
    avatar: (env.ADMIN_AVATAR || '').trim(),
    password: env.ADMIN_PASSWORD || '',
    passcode: env.ADMIN_PASSCODE || '',
    // Random signing key for sign-in tokens (optional but recommended), so
    // tokens can't be forged by someone who guesses the password.
    secret: env.ADMIN_SECRET || '',
  };
  return cfg.name && cfg.avatar && cfg.password && cfg.passcode ? cfg : null;
}

const digest = (s) => createHash('sha256').update(String(s)).digest();
const sameSecret = (a, b) => timingSafeEqual(digest(a), digest(b));

// Signing key derived from the secrets, so changing them signs everyone out.
const signingKey = (cfg) => digest(`letter-blitz-admin:${cfg.secret}:${cfg.password}:${cfg.passcode}`);
const sign = (cfg, payload) => createHmac('sha256', signingKey(cfg)).update(payload).digest('base64url');

export function isAdminEntry(cfg, name, avatar) {
  return !!cfg && String(name || '').trim().toLowerCase() === cfg.name && avatar === cfg.avatar;
}

export function createAdmin(store, cfg, now = () => Date.now()) {
  async function readAttempts(key) {
    const res = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    return (res && res.data) || { failures: 0, lockedUntil: 0 };
  }

  return {
    // Returns a token on success; throws { code } on failure.
    async login(password, passcode, ip) {
      if (!cfg) throw Object.assign(new Error('Admin disabled'), { code: 'admin_denied' });
      const key = attemptsKey(ip);
      const attempts = await readAttempts(key);
      if (attempts.lockedUntil > now()) throw Object.assign(new Error('Locked'), { code: 'admin_locked' });

      const ok = sameSecret(password, cfg.password) & sameSecret(passcode, cfg.passcode);
      if (!ok) {
        const failures = (attempts.lockedUntil && attempts.lockedUntil <= now() ? 0 : attempts.failures) + 1;
        const lockedUntil = failures >= MAX_FAILURES ? now() + LOCK_MS : 0;
        await store.setJSON(key, { failures: lockedUntil ? 0 : failures, lockedUntil });
        throw Object.assign(new Error('Denied'), { code: lockedUntil ? 'admin_locked' : 'admin_denied' });
      }
      await store.setJSON(key, { failures: 0, lockedUntil: 0 });
      const payload = Buffer.from(JSON.stringify({ exp: now() + TOKEN_TTL_MS })).toString('base64url');
      return `${payload}.${sign(cfg, payload)}`;
    },

    verify(token) {
      if (!cfg || typeof token !== 'string') return false;
      const [payload, sig] = token.split('.');
      if (!payload || !sig) return false;
      const expected = sign(cfg, payload);
      if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
      try {
        return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > now();
      } catch {
        return false;
      }
    },
  };
}
