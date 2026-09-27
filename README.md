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

1. One player creates a room (sets round length & categories per round) and
   gets a 4-character room code.
2. Everyone else joins with that code and a name &mdash; own phone, own screen.
3. The host starts the game: everyone gets the same random letter and
   category list, and a synchronized countdown begins.
4. When time's up, every player's answers are revealed to the whole group at
   once, scored automatically (unique valid answer = 10 pts, an answer two or
   more players share = 0 pts for all of them, blank or wrong-letter = 0).
   Before scoring, every answer is looked up online (Wikipedia, English and
   French). Anything that can't be found &mdash; a made-up name or word &mdash;
   is marked **not found** and scores 0.
5. The round's top scorer picks the next letter. The moment they pick it, the
   next round starts for everyone at the same time.
6. Total scores carry across rounds &mdash; play as many rounds as you like.

## Notes

- The online check only confirms an answer *exists*, not that it fits the
  category ("Ghana" passes as a fruit). Players still judge that part.
  If Wikipedia can't be reached, answers get the benefit of the doubt.
  Set the `WIKI_LANGS` environment variable on Netlify (default `en,fr`) to
  change languages.
- Rounds start with a 3-2-1 countdown so every phone starts at the same moment.
- Categories live in `netlify/lib/game.mjs` (`CATEGORY_BANK`). The nine core
  ones are used first; extras are mixed in when a room asks for more than nine.
- Rooms expire after 12 hours.
