// ---------------------------------------------------------------------------
// Category check
//
// Uses Wikidata to confirm an answer is the right *kind* of thing — "Ghana"
// is a country, not a fruit; "Liam" is a male given name; Beyoncé's
// occupation is singer. Each category is a SPARQL rule; an answer passes when
// one of its Wikidata matches satisfies the rule.
//
// For each answer: { exists, fits } — each true, false, or null when it
// couldn't be checked in time (the player gets the benefit of the doubt).
// ---------------------------------------------------------------------------

const USER_AGENT = 'LetterBlitz/1.0 (https://github.com/Jeremytpk/Letter-Blitz)';
const LANGS = ((typeof process !== 'undefined' && process.env.WIKI_LANGS) || 'en,fr')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const REQUEST_TIMEOUT_MS = 6000;
// Categories where the answer may be part of a longer name ("Corolla" -> "Toyota Corolla").
const PARTIAL_MATCH = new Set(['car']);
const SEARCH_CONCURRENCY = 8;
const QUERY_CONCURRENCY = 5; // the Wikidata query service allows 5 at once per IP
const CACHE_MAX = 5000;
const cache = new Map(); // `${catId}|${simplified}` -> { exists, fits }, kept while the function is warm

// Walk the path starting from the answer's item (fast), not from the class.
const FORWARD = 'hint:Prior hint:gearing "forward" .';
// "is a (kind of) X": instance of / subclass of, through the subclass tree.
const isA = (...classes) =>
  classes
    .map((q) => `{ ?item wdt:P31/wdt:P279* wd:${q} . ${FORWARD} } UNION { ?item wdt:P279+ wd:${q} . ${FORWARD} }`)
    .join(' UNION ');
// A person whose occupation is (a kind of) X.
const worksAs = (...occupations) =>
  occupations.map((q) => `{ ?item wdt:P106/wdt:P279* wd:${q} . ${FORWARD} }`).join(' UNION ');

export const CATEGORY_RULES = {
  country: isA('Q6256', 'Q3624078'), // country, sovereign state
  // Current capital of a country (former capitals like Lagos don't count).
  capital: `?c p:P36 ?st . ?st ps:P36 ?item . FILTER NOT EXISTS { ?st pq:P582 ?end } ${isA('Q6256', 'Q3624078').replace(/\?item/g, '?c')}`,
  city: isA('Q486972', 'Q515'), // human settlement, city
  man: isA('Q12308941', 'Q3409032'), // male given name, unisex given name
  woman: isA('Q11879590', 'Q3409032'), // female given name, unisex given name
  singer: `${worksAs('Q177220', 'Q639669')} UNION ${isA('Q215380')}`, // singer, musician, band
  car: `${isA('Q1420', 'Q3231690', 'Q786820', 'Q59773381')} UNION { ?item wdt:P452 wd:Q190117 . }`,
  actor: worksAs('Q33999', 'Q245068'), // actor, comedian
  fruit: isA('Q1364', 'Q3314483'), // fruit, edible fruit
  animal: `{ ?item wdt:P171* wd:Q729 . } UNION ${isA('Q729', 'Q16521')}`,
  food: isA('Q2095', 'Q746549', 'Q25403900'), // food, dish, food ingredient
  vegetable: isA('Q11004'),
  athlete: `${worksAs('Q2066131')} UNION { ?item wdt:P641 ?sport ; wdt:P31 wd:Q5 . }`,
  movie_tv: isA('Q11424', 'Q5398426', 'Q15416', 'Q1261214'), // film, TV series, TV programme, TV show
  brand: isA('Q431289', 'Q167270', 'Q4830453', 'Q783794'), // brand, trademark, business, company
  job: isA('Q28640', 'Q12737077'), // occupation, profession
  sport: isA('Q349', 'Q31629'), // sport, type of sport
};

let deadline = Infinity; // set per checkCategories() call

async function getJSON(url) {
  for (let attempt = 0; ; attempt++) {
    const left = deadline - Date.now();
    if (left < 200) throw new Error('out of time');
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
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

function simplify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

// Wikidata items whose name matches what the player typed.
async function candidates(text, partial) {
  const answer = simplify(text);
  const ids = new Set();
  // Label/alias search, one language at a time until something matches.
  for (const lang of LANGS) {
    const data = await getJSON(
      `${WIKIDATA_API}?action=wbsearchentities&format=json&type=item&limit=20&language=${lang}&search=${encodeURIComponent(text)}`
    );
    for (const e of data.search || []) {
      const names = [e.label, e.match && e.match.text, ...(e.aliases || [])];
      if (names.some((n) => labelMatches(n, answer, false))) ids.add(e.id);
    }
    if (ids.size) break;
  }
  // Longer names containing the answer ("Corolla" -> "Toyota Corolla").
  if (partial) {
    const data = await getJSON(
      `${WIKIDATA_API}?action=query&format=json&list=search&srlimit=15&srnamespace=0&srsearch=${encodeURIComponent(text)}`
    );
    const found = ((data.query && data.query.search) || []).map((e) => e.title).filter((id) => /^Q\d+$/.test(id));
    const labels = await fetchLabels(found);
    for (const id of found) {
      if ((labels.get(id) || []).some((l) => labelMatches(l, answer, true))) ids.add(id);
    }
  }
  return [...ids];
}

// Does a Wikidata label/alias correspond to what the player typed?
// Exact match, or (for PARTIAL_MATCH categories) the answer as whole words inside it.
function labelMatches(label, answer, partial) {
  const l = simplify(label);
  if (!l || !answer) return false;
  if (l === answer) return true;
  return partial && ` ${l} `.includes(` ${answer} `);
}

// Labels and aliases (in LANGS) for many items, 50 per request.
async function fetchLabels(ids) {
  const labels = new Map();
  const batches = [];
  for (let i = 0; i < ids.length; i += 50) batches.push(ids.slice(i, i + 50));
  await pool(
    batches.map((batch) => async () => {
      const data = await getJSON(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels|aliases&languages=${LANGS.join('|')}&ids=${batch.join('|')}`
      );
      for (const [id, e] of Object.entries(data.entities || {})) {
        const all = [
          ...Object.values(e.labels || {}).map((l) => l.value),
          ...Object.values(e.aliases || {}).flat().map((a) => a.value),
        ];
        labels.set(id, all);
      }
    }),
    SEARCH_CONCURRENCY
  );
  return labels;
}

// Which of these items satisfy the category's rule.
async function itemsFitting(catId, ids) {
  if (!ids.length) return new Set();
  const query = `
    SELECT DISTINCT ?item WHERE {
      VALUES ?item { ${ids.map((id) => `wd:${id}`).join(' ')} }
      ${CATEGORY_RULES[catId]}
    }`;
  const data = await getJSON(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`);
  return new Set(data.results.bindings.map((b) => b.item.value.split('/').pop()));
}

async function pool(tasks, limit) {
  const results = [];
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
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
    else if (!CATEGORY_RULES[a.catId]) out.set(key, UNKNOWN);
    else {
      out.set(key, UNKNOWN);
      todo.push(a);
    }
  }

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

  const byCat = new Map(); // catId -> [{ a, key, ids }]
  for (const a of todo) {
    const key = `${a.catId}|${a.text}`;
    const ids = idsByKey.get(key);
    if (!ids) continue; // search failed: stays unknown
    if (!ids.length) remember(a, key, { exists: false, fits: false }, out);
    else {
      if (!byCat.has(a.catId)) byCat.set(a.catId, []);
      byCat.get(a.catId).push({ a, key, ids });
    }
  }

  // 2. One rule query per category.
  await pool(
    [...byCat].map(([catId, items]) => async () => {
      try {
        const fitting = await itemsFitting(catId, [...new Set(items.flatMap((i) => i.ids))]);
        for (const { a, key, ids } of items) {
          remember(a, key, { exists: true, fits: ids.some((id) => fitting.has(id)) }, out);
        }
      } catch (err) {
        console.warn(`Category check failed for ${catId}:`, err.message);
        for (const { key } of items) out.set(key, { exists: true, fits: null });
      }
    }),
    QUERY_CONCURRENCY
  );
  return out;
}

function remember(a, key, result, out) {
  out.set(key, result);
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(`${a.catId}|${simplify(a.text)}`, result);
}
