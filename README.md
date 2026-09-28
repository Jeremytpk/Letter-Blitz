# Letter Blitz

A live, by-letter party game. The group gets a letter (e.g. **L**), and everyone
races to fill every category &mdash; Country, Capital City, City, Man's Name,
Woman's Name, Singer, Car, Comedian or Actor, Fruit and more &mdash; with a word
that starts with that letter before the clock runs out. Answers are revealed to
everyone at once; a matching answer between two players scores nobody, a unique
real answer scores 10. Whoever scored highest that round picks the next letter.

No sign-up: players just type a name to join. There is no separate server:
the whole game runs on **Netlify** &mdash; the page from `public/`, the game logic
in a Netlify Function (`netlify/functions/game.mjs`), and rooms stored in
Netlify Blobs. Each phone checks in about once a second to stay in sync.

## Deploy

1. On [netlify.com](https://netlify.com), **Add new site \+ Import from Git** and
   pick this repo. `netlify.toml` already has the right settings.
2. Deploy. Share the site URL &mdash; that's it. Netlify Blobs needs no setup.

Every push to `main` redeploys automatically.

## Run it locally

```bash
npm install
npx netlify-cli dev
```

Open the URL it prints (usually `http://localhost:8888`).

## How a game works

1. One player creates a room &mdash; choosing the number of rounds (1, 3, 5, 7
   or 11), round length and categories per round &mdash; and gets a
   4-character room code.
2. Everyone else joins with that code and a name &mdash; own phone, own screen.
3. The host starts the game: everyone gets the same random letter and
   category list, and a synchronized countdown begins.
4. When time's up, every player's answers are revealed to the whole group at
   once, scored automatically (unique valid answer = 10 pts, an answer two or
   more players share = 0 pts for all of them, blank or wrong-letter = 0).
   Before scoring, every answer is checked online against Wikidata &mdash;
   answers can be typed in French or English ("Pomme" or "Apple"). A made-up name or word is marked **not found**; a real
   thing in the wrong category (e.g. "Ghana" as a Fruit) is marked **wrong
   category**. Both score 0.
5. After the answers, a separate **Scores** screen shows the round points and
   totals; the round's top scorer picks the next letter there. The moment they pick it, the
   next round starts for everyone at the same time.
6. Total scores carry across rounds. After the last round a final-standings
   screen shows the game winner, and the host can tap **Play again** to reset
   scores and go back to the lobby with the same players.

## Notes

- Each category's rule lives in `netlify/lib/category-spec.mjs` (e.g. Fruit =
  "is a kind of fruit", Singer = "a person whose occupation is singer or
  musician", Capital City = "the current capital of a country"). Wikidata's
  class trees are precomputed into `category-data.mjs` so checks take ~1–2 s;
  after changing the spec, run `npm run build-categories`.
- Names must match exactly (accents and capitals don't matter); car models
  may be partial ("Corolla"). If Wikidata is slow or unreachable, unchecked
  answers get the benefit of the doubt.
- The site is in English and French: each player picks a language with the
  EN / FR switch (saved on their device; first visit follows the phone's
  language). All text is in `public/i18n.js`; the server sends error codes
  that each page translates.
- Each phone remembers its player name and room, so a refresh or lost
  connection rejoins automatically. Tapping **Leave** (after a confirmation)
  removes the player and erases that saved data.
- Rounds start with a 3-2-1 countdown so every phone starts at the same moment.
- The category list lives in `netlify/lib/game.mjs` (`CATEGORY_BANK`). The nine core
  ones are used first; extras are mixed in when a room asks for more than nine.
- Rooms expire after 12 hours.
