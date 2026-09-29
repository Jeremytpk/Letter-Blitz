// Builds the Word Blitz word bank: for every word in scripts/word-list.mjs,
// fetches a short meaning in English and French from Wikipedia and writes
// netlify/lib/word-data.mjs, so games never wait on Wikipedia.
//
//   npm run build-words
//
// Prints what needs a look: words too short, pages not found, pages that
// only list several meanings, and meanings missing in the other language.

import { writeFileSync } from 'node:fs';
import { WORD_LIST } from './word-list.mjs';

const USER_AGENT = 'LetterBlitz/1.0 (https://github.com/Jeremytpk/Letter-Blitz)';
const OUT = new URL('../netlify/lib/word-data.mjs', import.meta.url);
const MIN_LETTERS = 7;
const MAX_MEANING = 320;
const OTHER = { en: 'fr', fr: 'en' };

// null = no such page; throws if Wikipedia keeps refusing (e.g. too many requests).
async function getJSON(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (res.ok) return res.json();
    if (res.status === 404) return null;
    const wait = Number(res.headers.get('retry-after')) * 1000 || 1500 * 2 ** attempt;
    await new Promise((r) => setTimeout(r, Math.min(wait, 20000)));
  }
  throw new Error('Wikipedia did not answer');
}

// First sentences of the page's summary, up to MAX_MEANING characters.
function shorten(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  // A sentence ends at . ! or ? followed by a space (not the dot in "2.3 million").
  const sentences = clean.match(/.+?[.!?]+(?=\s|$)\s*/g) || [clean];
  let out = '';
  for (const s of sentences) {
    if (out && (out + s).length > MAX_MEANING) break;
    out += s;
  }
  return (out || clean).trim().slice(0, MAX_MEANING);
}

async function summary(lang, title) {
  const data = await getJSON(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
  if (!data) return { missing: true };
  if (data.type === 'disambiguation') return { disambiguation: true, title: data.title };
  return { title: data.title, text: shorten(data.extract) };
}

async function otherLanguageTitle(lang, title) {
  const data = await getJSON(
    `https://${lang}.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=${OTHER[lang]}&redirects=1&format=json&titles=${encodeURIComponent(title)}`
  );
  const page = data && Object.values(data.query.pages)[0];
  return page && page.langlinks ? page.langlinks[0]['*'] : null;
}

const letters = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/gi, '').length;

async function pool(tasks, limit) {
  let next = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < tasks.length) await tasks[next++]();
  }));
}

const out = {};
const problems = [];
const tasks = [];
for (const [lang, categories] of Object.entries(WORD_LIST)) {
  out[lang] = {};
  for (const [cat, entries] of Object.entries(categories)) {
    const seen = new Set();
    out[lang][cat] = [];
    for (const entry of entries) {
      const [word, page = word, otherPage] = entry.split('|');
      const key = word.toLowerCase();
      if (seen.has(key)) { problems.push(`${lang}/${cat}: "${word}" is listed twice`); continue; }
      seen.add(key);
      if (letters(word) < MIN_LETTERS) { problems.push(`${lang}/${cat}: "${word}" is too short (skipped)`); continue; }
      if (/[\s-]/.test(word)) { problems.push(`${lang}/${cat}: "${word}" has a space or hyphen (skipped)`); continue; }
      const item = { word, meaning: { en: '', fr: '' } };
      out[lang][cat].push(item);
      tasks.push(async () => {
        try {
          await fill();
        } catch (err) {
          problems.push(`${lang}/${cat}: "${word}" — ${err.message}, run again`);
        }
      });
      const fill = async () => {
        const own = await summary(lang, page);
        if (own.missing) return problems.push(`${lang}/${cat}: "${word}" — no Wikipedia page "${page}"`);
        if (own.disambiguation) return problems.push(`${lang}/${cat}: "${word}" — "${page}" lists several meanings; give a precise page`);
        item.meaning[lang] = own.text;
        const otherTitle = otherPage || (await otherLanguageTitle(lang, own.title));
        const other = otherTitle ? await summary(OTHER[lang], otherTitle) : { missing: true };
        if (other.text) item.meaning[OTHER[lang]] = other.text;
        else problems.push(`${lang}/${cat}: "${word}" — no ${OTHER[lang].toUpperCase()} meaning`);
      };
    }
  }
}

console.log(`Fetching meanings for ${tasks.length} words…`);
await pool(tasks, 2);

// Keep only words with a meaning in the room's language.
let total = 0;
for (const lang of Object.keys(out)) {
  for (const cat of Object.keys(out[lang])) {
    out[lang][cat] = out[lang][cat].filter((w) => w.meaning[lang]);
    total += out[lang][cat].length;
    console.log(`${lang} ${cat.padEnd(10)} ${out[lang][cat].length} words`);
  }
}
writeFileSync(OUT, `// Generated by scripts/build-words.mjs from scripts/word-list.mjs — do not edit by hand.\nexport default ${JSON.stringify(out)};\n`);
console.log(`\nWrote ${total} words to netlify/lib/word-data.mjs`);
if (problems.length) console.log(`\nTo look at (${problems.length}):\n- ${problems.join('\n- ')}`);
