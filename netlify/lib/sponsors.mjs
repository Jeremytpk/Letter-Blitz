// ---------------------------------------------------------------------------
// Sponsor campaigns and prizes.
//
// While a campaign runs, room creators can choose it for a "real prizes"
// game: a "presented by" banner, an optional sponsored category, and a prize
// for the winner of an eligible game (enough players and rounds). Prize codes are
// handed out one per winner, one prize per player per campaign, and are only
// ever sent to the winner's own device. Answers given in the sponsor's
// category are kept (without player names) so the sponsor can see what
// players think of their products.
//
// Documents: campaign-<id> (settings), campcodes-<id> (prize codes),
// campstats-<id> (numbers for the sponsor), claim-<id>-… (each prize given),
// prizegot-<id>-<playerId> (one prize per player per campaign),
// campans-<id>-<roomCreatedAt>-<roomCode> (sponsor-category answers, one per room).
// ---------------------------------------------------------------------------

import { randomBytes } from 'node:crypto';
import { cleanText } from './security.mjs';

const CAMPAIGN = 'campaign-';
const CODES = 'campcodes-';
const STATS = 'campstats-';
const CLAIM = 'claim-';
const ANSWERS = 'campans-';

export class SponsorError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const bilingual = (v, max) => ({ en: cleanText(v && v.en, { max }), fr: cleanText(v && v.fr, { max }) });
const multiline = (v, max) => ({ en: cleanText(v && v.en, { max, singleLine: false }), fr: cleanText(v && v.fr, { max, singleLine: false }) });
const LOGO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
const MAX_LOGO = 120 * 1024;
const MAX_CODES = 5000;
export const MAX_SPONSOR_CATEGORIES = 3;

// A campaign's own categories: [{ label: { en, fr }, checkAs }], played one
// per round in turn. Campaigns saved before there could be several had a
// single categoryLabel / checkAs.
export function campaignCategories(c) {
  if (!c) return [];
  if (Array.isArray(c.categories)) return c.categories;
  return c.categoryLabel && (c.categoryLabel.en || c.categoryLabel.fr) ? [{ label: c.categoryLabel, checkAs: c.checkAs || '' }] : [];
}

function validUrl(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  try {
    const url = new URL(s);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function parseCodes(text) {
  return [
    ...new Set(
      String(text || '')
        .split(/[\s,;]+/)
        .map((c) => c.trim())
        .filter((c) => /^[A-Za-z0-9_-]{2,40}$/.test(c))
    ),
  ];
}

// What players are allowed to see about a campaign.
export function publicCampaign(c) {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    url: c.url,
    color: c.color,
    logo: c.logo,
    tagline: c.tagline,
    prize: c.prize,
    categories: campaignCategories(c).map((cat) => ({ label: cat.label })),
    minPlayers: c.minPlayers,
    minRounds: c.minRounds,
    collectEmail: c.collectEmail,
    extraRules: c.extraRules,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
  };
}

export function createSponsors(store, now = () => Date.now(), categoryIds = []) {
  async function getJSON(key) {
    return store.get(key, { type: 'json', consistency: 'strong' });
  }

  // Read-modify-write with the document's ETag, like rooms.
  async function mutate(key, fn, initial) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const res = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
      const data = res && res.data ? res.data : structuredClone(initial);
      const out = fn(data);
      const write = res && res.etag
        ? await store.setJSON(key, data, { onlyIfMatch: res.etag })
        : await store.setJSON(key, data, { onlyIfNew: true });
      if (write.modified) return out;
      await new Promise((r) => setTimeout(r, 20 + Math.random() * 80 * (attempt + 1)));
    }
    throw new SponsorError('busy', 'Busy — try again.');
  }

  async function list() {
    const { blobs } = await store.list({ prefix: CAMPAIGN });
    const all = await Promise.all(blobs.map((b) => getJSON(b.key)));
    return all.filter(Boolean).sort((a, b) => b.startsAt - a.startsAt);
  }

  return {
    list,

    async get(id) {
      return /^[a-z0-9]{8,24}$/.test(String(id || '')) ? getJSON(CAMPAIGN + id) : null;
    },

    // Campaigns running right now, for room creators to choose from.
    async live() {
      const t = now();
      return (await list()).filter((c) => c.active && c.startsAt <= t && t < c.endsAt);
    },

    // Admin: create or update a campaign; `addCodes` appends prize codes.
    async save(input, addCodes) {
      const t = now();
      const id = /^[a-z0-9]{8,24}$/.test(String(input.id || '')) ? input.id : randomBytes(6).toString('hex');
      const existing = await getJSON(CAMPAIGN + id);
      const name = cleanText(input.name, { max: 60 });
      if (!name) throw new SponsorError('sponsor_invalid', 'The sponsor needs a name.');
      const startsAt = Date.parse(input.startsAt);
      const endsAt = Date.parse(input.endsAt);
      if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) {
        throw new SponsorError('sponsor_invalid', 'Pick a start and an end date (end after start).');
      }
      let logo = existing ? existing.logo : '';
      if (input.logo === '') logo = '';
      else if (input.logo) {
        if (!LOGO_RE.test(input.logo) || input.logo.length > MAX_LOGO) {
          throw new SponsorError('sponsor_invalid', 'The logo must be a PNG, JPEG or WebP image under 90 KB.');
        }
        logo = input.logo;
      }
      const categories = (Array.isArray(input.categories) ? input.categories : [])
        .map((cat) => ({ label: bilingual(cat && cat.label, 60), checkAs: categoryIds.includes(cat && cat.checkAs) ? cat.checkAs : '' }))
        .filter((cat) => cat.label.en || cat.label.fr)
        .slice(0, MAX_SPONSOR_CATEGORIES);
      const campaign = {
        id,
        name,
        url: validUrl(input.url),
        color: /^#[0-9a-f]{6}$/i.test(String(input.color || '')) ? input.color : '#ff3e6c',
        logo,
        tagline: bilingual(input.tagline, 120),
        prize: bilingual(input.prize, 120),
        categories,
        minPlayers: Math.min(12, Math.max(2, Math.round(Number(input.minPlayers) || 3))),
        minRounds: [1, 3, 5, 7, 11].includes(Number(input.minRounds)) ? Number(input.minRounds) : 3,
        collectEmail: !!input.collectEmail,
        extraRules: multiline(input.extraRules, 2000),
        startsAt,
        endsAt,
        active: !!input.active,
        createdAt: existing ? existing.createdAt : t,
        updatedAt: t,
      };
      await store.setJSON(CAMPAIGN + id, campaign);
      const added = parseCodes(addCodes);
      if (added.length) {
        await mutate(
          CODES + id,
          (d) => {
            const known = new Set(d.codes);
            for (const c of added) if (!known.has(c) && d.codes.length < MAX_CODES) d.codes.push(c);
          },
          { codes: [], used: 0 }
        );
      }
      return campaign;
    },

    async remove(id) {
      const { blobs } = await store.list({ prefix: `${CLAIM}${id}-` });
      const marks = await store.list({ prefix: `prizegot-${id}-` });
      const answers = await store.list({ prefix: `${ANSWERS}${id}-` });
      await Promise.all([...blobs, ...marks.blobs, ...answers.blobs].map((b) => store.delete(b.key)));
      await Promise.all([CAMPAIGN, CODES, STATS].map((p) => store.delete(p + id)));
    },

    async bump(id, deltas) {
      try {
        await mutate(
          STATS + id,
          (d) => {
            for (const [k, v] of Object.entries(deltas)) d[k] = (d[k] || 0) + v;
          },
          {}
        );
      } catch (err) {
        console.warn('Sponsor stats failed:', err.message);
      }
    },

    async report(id) {
      const [stats, codes, claims] = await Promise.all([getJSON(STATS + id), getJSON(CODES + id), store.list({ prefix: `${CLAIM}${id}-` })]);
      const c = codes || { codes: [], used: 0 };
      return { ...(stats || {}), codesTotal: c.codes.length, codesLeft: c.codes.length - c.used, claims: claims.blobs.length };
    },

    // Give one prize to a player: null if they already won this campaign or
    // no codes are left.
    async award(campaign, player, roomCode) {
      const mark = await store.setJSON(`prizegot-${campaign.id}-${player.id}`, { t: now() }, { onlyIfNew: true });
      if (!mark.modified) return { status: 'already_won' };
      const code = await mutate(
        CODES + campaign.id,
        (d) => (d.used < d.codes.length ? d.codes[d.used++] : null),
        { codes: [], used: 0 }
      );
      if (!code) {
        await store.delete(`prizegot-${campaign.id}-${player.id}`);
        return { status: 'no_codes' };
      }
      const t = now();
      const claimKey = `${CLAIM}${campaign.id}-${t}-${randomBytes(3).toString('hex')}`;
      await store.setJSON(claimKey, {
        campaignId: campaign.id,
        campaignName: campaign.name,
        code,
        roomCode,
        playerName: player.name,
        avatar: player.avatar || '',
        score: player.totalScore,
        email: '',
        consent: false,
        createdAt: t,
      });
      return { status: 'awarded', code, claimKey };
    },

    // Winner adds their email so the sponsor can deliver the prize.
    async addEmail(claimKey, email) {
      if (!String(claimKey).startsWith(CLAIM)) return false;
      const claim = await getJSON(claimKey);
      if (!claim) return false;
      claim.email = email;
      claim.consent = true;
      claim.emailAt = now();
      await store.setJSON(claimKey, claim);
      return true;
    },

    // Keep one round's answers in the sponsor's category (no player names).
    // Returns how many were saved.
    async recordAnswers(id, room, round, letter, category, entries) {
      const answers = entries.filter((e) => e.text).map(({ text, valid, exists, points }) => ({ text, valid, exists, points }));
      if (!answers.length) return 0;
      try {
        return await mutate(
          `${ANSWERS}${id}-${room.createdAt}-${room.code}`,
          (d) => {
            if (d.rounds.some((r) => r.round === round)) return 0;
            d.rounds.push({ round, letter, category, at: now(), answers });
            return answers.length;
          },
          { roomCode: room.code, roomCreatedAt: room.createdAt, rounds: [] }
        );
      } catch (err) {
        console.warn('Saving sponsor answers failed:', err.message);
        return 0;
      }
    },

    // Every answer given in a campaign's category (all campaigns if no id), newest first.
    async answers(id) {
      if (id && !/^[a-z0-9]{8,24}$/.test(String(id))) return [];
      const campaigns = new Map((await list()).map((c) => [c.id, c.name]));
      const { blobs } = await store.list({ prefix: id ? `${ANSWERS}${id}-` : ANSWERS });
      const docs = await Promise.all(blobs.map((b) => getJSON(b.key)));
      const rows = [];
      blobs.forEach((b, n) => {
        const doc = docs[n];
        if (!doc) return;
        const campaignId = b.key.slice(ANSWERS.length).split('-')[0];
        for (const r of doc.rounds) {
          r.answers.forEach((a, i) => {
            rows.push({
              id: `${doc.roomCode}-${doc.roomCreatedAt}-${r.round}-${i}`,
              campaign: campaigns.get(campaignId) || campaignId,
              at: r.at,
              roomCode: doc.roomCode,
              round: r.round,
              letter: r.letter,
              category: r.category,
              ...a,
            });
          });
        }
      });
      return rows.sort((a, b) => b.at - a.at);
    },

    async claims(id) {
      const { blobs } = await store.list({ prefix: id ? `${CLAIM}${id}-` : CLAIM });
      const all = await Promise.all(blobs.map((b) => getJSON(b.key)));
      return all.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt);
    },
  };
}
