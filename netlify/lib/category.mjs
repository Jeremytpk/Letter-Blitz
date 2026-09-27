// ---------------------------------------------------------------------------
// Category check
//
// Uses Wikidata to confirm an answer is a real thing of the right *kind* —
// "Ghana" is a country, not a fruit; "Liam" is a male given name; Beyoncé's
// occupation is singer. Answers may be in French or English.
//
// 1. Search Wikidata for items named like the answer (French + English).
// 2. Fetch those items' types in one quick query.
// 3. Compare against the precomputed lists in category-data.mjs
//    (see category-spec.mjs and scripts/build-categories.mjs).
//
// For each answer: { exists, fits } — each true, false, or null when it
// couldn't be checked in time (the player gets the benefit of the doubt).
// ---------------------------------------------------------------------------

import { CATEGORY_SPEC } from './category-spec.mjs';
import categoryData from './category-data.mjs';

const USER_AGENT = 'LetterBlitz/1.0 (https://github.com/Jeremytpk/Letter-Blitz)';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const SPARQL_URL = 'https://query.wikidata.org/sparql';
// Search language; its fallback chain includes English, so French and English
// names are both matched with one request.
const SEARCH_LANGUAGE = (typeof process !== 'undefined' && process.env.SEARCH_LANGUAGE) || 'fr';
const LABEL_LANGS = 'fr|en';
const REQUEST_TIMEOUT_MS = 6000;
const MAX_CANDIDATES = 15; // best-ranked name matches checked per answer
// Categories where the answer may be part of a longer name ("Corolla" -> "Toyota Corolla").
const PARTIAL_MATCH = new Set(['car']);
const SEARCH_CONCURRENCY = 8;
const FACTS_BATCH = 300;
const CACHE_MAX = 5000;
const cache = new Map(); // `${catId}|${simplified}` -> { exists, fits }, kept while the function is warm

const toSet = (nums) => new Set((nums || []).map((n) => `Q${n}`));
const CLASS_SETS = Object.fromEntries(Object.entries(categoryData.classes).map(([k, v]) => [k, toSet(v)]));
const OCCUPATION_SETS = Object.fromEntries(Object.entries(categoryData.occupations).map(([k, v]) => [k, toSet(v)]));
const CAPITALS = toSet(categoryData.capitals);
const FACT_PROPS = ['P31', 'P279', 'P106', ...new Set(Object.values(CATEGORY_SPEC).flatMap((s) => Object.keys(s.claims || {})))];

let deadline = Infinity; // set per checkCategories() call

async function request(url, init = {}) {
  for (let attempt = 0; ; attempt++) {
    const left = deadline - Date.now();
    if (left < 200) throw new Error('out of time');
    const res = await fetch(url, {
      ...init,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...init.headers },
      signal: AbortSignal.timeout(Math.min(REQUEST_TIMEOUT_MS, left)),
    });
    if (res.ok) return res.json();
    // Rate limited or busy: back off briefly and retry.
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      const wait = Math.min(1500, Number(res.headers.get('retry-after')) * 1000 || 400 * (attempt + 1));
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error(`${new URL(url).host} ${res.status}`);
  }
}

function sparql(query) {
  return request(SPARQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json' },
    body: new URLSearchParams({ query }),
  });
}

function simplify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Does a Wikidata label/alias correspond to what the player typed?
// Exact match, or (for PARTIAL_MATCH categories) the answer as whole words inside it.
// French labels often list both genders ("plombier ou plombière", "acteur/actrice"),
// so each form is tried on its own.
function labelMatches(label, answer, partial) {
  if (!label || !answer) return false;
  return [label, ...String(label).split(/\s+ou\s+|\s*[\/,]\s*/)].some((form) => {
    const l = simplify(form);
    if (!l) return false;
    if (l === answer) return true;
    return partial && ` ${l} `.includes(` ${answer} `);
  });
}

// Wikidata items whose name matches what the player typed.
async function candidates(text, partial) {
  const answer = simplify(text);
  const ids = new Set();
  // One label/alias search covers both languages: Wikidata's French search
  // falls back to English, so "Pomme" and "Apple" both reach the fruit.
  const data = await request(
    `${WIKIDATA_API}?action=wbsearchentities&format=json&type=item&limit=50&language=${SEARCH_LANGUAGE}&search=${encodeURIComponent(text)}`
  );
  for (const e of data.search || []) {
    const names = [e.label, e.match && e.match.text, ...(e.aliases || [])];
    if (names.some((n) => labelMatches(n, answer, false))) ids.add(e.id);
    if (ids.size >= MAX_CANDIDATES) break;
  }
  // Longer names containing the answer ("Corolla" -> "Toyota Corolla"),
  // only when nothing matched exactly.
  if (partial && !ids.size) {
    const found = await request(
      `${WIKIDATA_API}?action=query&format=json&list=search&srlimit=15&srnamespace=0&srsearch=${encodeURIComponent(text)}`
    );
    const qids = ((found.query && found.query.search) || []).map((e) => e.title).filter((id) => /^Q\d+$/.test(id));
    if (qids.length) {
      const labels = await request(
        `${WIKIDATA_API}?action=wbgetentities&format=json&props=labels|aliases&languages=${LABEL_LANGS}&ids=${qids.join('|')}`
      );
      for (const [id, e] of Object.entries(labels.entities || {})) {
        const names = [
          ...Object.values(e.labels || {}).map((l) => l.value),
          ...Object.values(e.aliases || {}).flat().map((a) => a.value),
        ];
        if (names.some((n) => labelMatches(n, answer, true))) ids.add(id);
        if (ids.size >= MAX_CANDIDATES) break;
      }
    }
  }
  return [...ids];
}

// Types, occupations and other facts for many items: Map id -> { P31: Set, ... }
async function fetchFacts(ids) {
  const facts = new Map(ids.map((id) => [id, {}]));
  const batches = [];
  for (let i = 0; i < ids.length; i += FACTS_BATCH) batches.push(ids.slice(i, i + FACTS_BATCH));
  await Promise.all(
    batches.map(async (batch) => {
      const data = await sparql(`SELECT ?item ?p ?v WHERE {
        VALUES ?item { ${batch.map((id) => `wd:${id}`).join(' ')} }
        VALUES ?p { ${FACT_PROPS.map((p) => `wdt:${p}`).join(' ')} }
        ?item ?p ?v .
      }`);
      for (const b of data.results.bindings) {
        const id = b.item.value.split('/').pop();
        const prop = b.p.value.split('/').pop();
        const f = facts.get(id);
        if (!f[prop]) f[prop] = new Set();
        f[prop].add(b.v.value.split('/').pop());
      }
    })
  );
  return facts;
}

// Living things descending from a taxon (e.g. animals) — the tree of life is
// too big to precompute, so this one walks it live.
async function taxaWithin(ids, taxon) {
  if (!ids.length) return new Set();
  const data = await sparql(`SELECT DISTINCT ?item WHERE {
    VALUES ?item { ${ids.map((id) => `wd:${id}`).join(' ')} }
    ?item wdt:P171* wd:${taxon} . hint:Prior hint:gearing "forward" .
  }`);
  return new Set(data.results.bindings.map((b) => b.item.value.split('/').pop()));
}

function fits(catId, id, f, taxa) {
  const spec = CATEGORY_SPEC[catId];
  const any = (prop, set) => [...(f[prop] || [])].some((v) => set.has(v));
  if (spec.capitals && CAPITALS.has(id)) return true;
  const classes = CLASS_SETS[catId];
  if (classes && (classes.has(id) || any('P31', classes) || any('P279', classes))) return true;
  const occupations = OCCUPATION_SETS[catId];
  if (occupations && any('P106', occupations)) return true;
  for (const [prop, values] of Object.entries(spec.claims || {})) {
    if (any(prop, new Set(values))) return true;
  }
  if (spec.taxonOf && taxa.has(id)) return true;
  return false;
}

async function pool(tasks, limit) {
  let next = 0;
  async function worker() {
    while (next < tasks.length) await tasks[next++]();
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
}

/**
 * @param {{catId: string, text: string}[]} answers
 * @param {{timeLimitMs?: number}} [options]
 * @returns {Promise<Map<string, {exists: boolean|null, fits: boolean|null}>>} keyed by `${catId}|${text}`
 */
export async function checkCategories(answers, { timeLimitMs = 7000 } = {}) {
  deadline = Date.now() + timeLimitMs;
  const UNKNOWN = { exists: null, fits: null };
  const out = new Map();
  const todo = [];
  for (const a of answers) {
    const key = `${a.catId}|${a.text}`;
    if (out.has(key) || !a.text.trim()) continue;
    const cached = cache.get(`${a.catId}|${simplify(a.text)}`);
    if (cached) out.set(key, cached);
    else {
      out.set(key, UNKNOWN);
      if (CATEGORY_SPEC[a.catId]) todo.push(a);
    }
  }
  if (!todo.length) return out;

  // 1. Find the Wikidata items each answer could mean.
  const idsByKey = new Map();
  await pool(
    todo.map((a) => async () => {
      try {
        idsByKey.set(`${a.catId}|${a.text}`, await candidates(a.text, PARTIAL_MATCH.has(a.catId)));
      } catch (err) {
        console.warn(`Wikidata search failed for "${a.text}":`, err.message);
      }
    }),
    SEARCH_CONCURRENCY
  );

  // 2. Look up what those items are (plus the tree of life for animals).
  const idsFor = (a) => idsByKey.get(`${a.catId}|${a.text}`) || [];
  const allIds = [...new Set(todo.flatMap(idsFor))];
  const taxonRoots = [...new Set(todo.map((a) => CATEGORY_SPEC[a.catId].taxonOf).filter(Boolean))];
  let facts = null;
  const taxa = new Set();
  const [factsResult, ...taxaResults] = await Promise.allSettled([
    fetchFacts(allIds),
    ...taxonRoots.map((root) =>
      taxaWithin([...new Set(todo.filter((a) => CATEGORY_SPEC[a.catId].taxonOf === root).flatMap(idsFor))], root)
    ),
  ]);
  if (factsResult.status === 'fulfilled') facts = factsResult.value;
  else console.warn('Wikidata facts unavailable:', factsResult.reason.message);
  for (const r of taxaResults) if (r.status === 'fulfilled') for (const id of r.value) taxa.add(id);

  // 3. Judge each answer.
  for (const a of todo) {
    const key = `${a.catId}|${a.text}`;
    const ids = idsByKey.get(key);
    if (!ids) continue; // search failed: stays unknown
    if (!ids.length) remember(a, key, { exists: false, fits: false }, out);
    else if (!facts) out.set(key, { exists: true, fits: null });
    else remember(a, key, { exists: true, fits: ids.some((id) => fits(a.catId, id, facts.get(id) || {}, taxa)) }, out);
  }
  return out;
}

function remember(a, key, result, out) {
  out.set(key, result);
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(`${a.catId}|${simplify(a.text)}`, result);
}
