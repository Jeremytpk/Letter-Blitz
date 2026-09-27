// ---------------------------------------------------------------------------
// Online answer check
//
// Looks each answer up on Wikipedia to catch made-up words and fake names.
// Returns true (found), false (can't be found) or null (lookup failed — the
// player gets the benefit of the doubt).
// ---------------------------------------------------------------------------

const WIKI_LANGS = (process.env.WIKI_LANGS || 'en,fr')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const REQUEST_TIMEOUT_MS = 4000;
const CONCURRENCY = 8;
const USER_AGENT = 'LetterBlitz/1.0 (https://github.com/Jeremytpk/Letter-Blitz)';

const cache = new Map(); // normalized answer -> true | false
const MAX_CACHE = 5000;

function simplify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ') // "Liam (given name)" -> "liam"
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titleCase(text) {
  return text.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

async function wikiQuery(lang, params) {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  for (const [k, v] of Object.entries({ ...params, format: 'json', formatversion: '2', origin: '*' })) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Wikipedia ${lang} ${res.status}`);
  return res.json();
}

// Exact article (or redirect) with this title, tried as typed and in Title Case.
async function hasExactPage(lang, text) {
  const titles = [...new Set([text, titleCase(text)])].join('|');
  const data = await wikiQuery(lang, { action: 'query', titles, redirects: '1' });
  const pages = (data.query && data.query.pages) || [];
  return pages.some((p) => !p.missing && !p.invalid);
}

// Search results whose title contains every word of the answer
// ("Leonardo" -> "Leonardo da Vinci", "Liam" -> "Liam (given name)").
async function hasMatchingSearchResult(lang, text) {
  const target = simplify(text);
  if (!target) return false;
  const words = target.split(' ');
  const data = await wikiQuery(lang, { action: 'query', list: 'search', srsearch: text, srlimit: '10' });
  const results = (data.query && data.query.search) || [];
  return results.some((r) => {
    const titleWords = simplify(r.title).split(' ');
    return words.every((w) => titleWords.includes(w));
  });
}

async function checkOne(text) {
  const key = simplify(text);
  if (cache.has(key)) return cache.get(key);

  let anySucceeded = false;
  for (const lang of WIKI_LANGS) {
    try {
      if (await hasExactPage(lang, text)) return remember(key, true);
      if (await hasMatchingSearchResult(lang, text)) return remember(key, true);
      anySucceeded = true;
    } catch (err) {
      console.warn(`Answer check failed for "${text}" on ${lang}:`, err.message);
    }
  }
  return anySucceeded ? remember(key, false) : null;
}

function remember(key, value) {
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(key, value);
  return value;
}

/**
 * Check many answers at once.
 * @param {string[]} texts
 * @returns {Promise<Map<string, boolean|null>>} keyed by the original text
 */
async function checkAnswers(texts) {
  const unique = [...new Set(texts.filter((t) => t && t.trim()))];
  const results = new Map();
  let next = 0;
  async function worker() {
    while (next < unique.length) {
      const text = unique[next++];
      results.set(text, await checkOne(text));
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, unique.length) }, worker));
  return results;
}

module.exports = { checkAnswers };
