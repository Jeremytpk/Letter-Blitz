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
2. Deploy. The game lives at **https://letterblitz.world** (the old
   `letterblitz.netlify.app` address redirects there). Netlify Blobs needs no setup.

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
2. Everyone picks a name and one of 12 original avatars (humans, alien,
   cyborg, robot, animals, a cat hybrid, dragon, octopus, yeti &mdash; see
   `public/avatars.js`), then joins with the code or an **invite link**
   (`/?room=ABCD`, shared from the lobby).
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
- Only the room head (👑) can pass the crown or close the room. When they
  leave, they must either give the crown to another player or close the room
  for everyone (the server refuses anything else) — only that makes someone
  else the owner. If the owner is inactive for 60 seconds, the
  longest-standing player still online holds the crown meanwhile (they can
  run the game but not close the room or give the crown away), and it goes
  back to the owner as soon as they return. Everyone else can leave at any
  time, including mid-round, after a confirmation.
- Everyone gets a notification (with avatar) when a player joins the room.
- In the timer bar the room head always has a 👥 button with the player
  count and a scrolling player list (with each player's progress); a switch
  in that list makes it visible to everyone, and can be turned off anytime.
- During a round the timer stays pinned to the top of the screen and turns
  amber, then red, as time runs out.
- Each phone remembers its player name and room, so a refresh or lost
  connection rejoins automatically. Tapping **Leave** (after a confirmation)
  removes the player and erases that saved data.
- Rounds start with a 3-2-1 countdown so every phone starts at the same moment.
- The category list lives in `netlify/lib/game.mjs` (`CATEGORY_BANK`). The nine core
  ones are used first; extras are mixed in when a room asks for more than nine.
- Rooms expire after 12 hours. A room where nobody has been active for
  3 minutes closes automatically; members who come back see a page saying
  it was closed for inactivity.
- **Admin dashboard** (visits, players, rooms, live rooms and players, time
  played) is switched on by four environment variables set in Netlify —
  `ADMIN_NAME`, `ADMIN_AVATAR`, `ADMIN_PASSWORD`, `ADMIN_PASSCODE`. Their
  values are never stored in this repository (a local copy lives in `.env`,
  which git ignores). See `netlify/lib/admin.mjs`.
- Rooms leave the game about 12 hours after creation (hourly scheduled
  function `netlify/functions/cleanup.mjs`); a summary of each (code, dates,
  rounds, player names, avatars, scores — not answers) goes to the admin
  archive. Admin data (statistics and archive) is never deleted
  automatically — only from the dashboard's "Free up space" section.
- **Saving admin data locally:** `npm run export-data` signs in with the
  credentials in `.env` and saves a dated snapshot plus running
  `all-*.csv` files into `admin-data/` (ignored by git). Add
  `-- --delete-after` to then free space online (archive and daily history
  older than today; totals are kept). The dashboard also has CSV downloads.
- About, Privacy and Terms pages: `public/about.html`, `privacy.html`,
  `terms.html` (English and French).
- **Feedback & messages:** players are asked for a 1–5 star rating (with an
  optional comment) after the last round or when they leave a room, and can
  write in from `public/contact.html`. Both show on the admin dashboard and
  are saved by `npm run export-data` into their own files,
  `admin-data/all-feedback.csv` and `admin-data/all-messages.csv`.
- **Security:** strict security headers (Content-Security-Policy, HSTS,
  no framing, no MIME sniffing) in `netlify.toml`; the API
  (`netlify/lib/security.mjs`) refuses requests from other websites,
  oversized bodies and floods, validates room codes, player ids and text,
  and rate-limits rooms, joins, look-ups, visits, feedback and messages per
  network address. Admin tokens are signed with `ADMIN_SECRET` (a random
  Netlify environment variable); CSV exports neutralise spreadsheet
  formulas. Report problems via `/.well-known/security.txt`.
- **Party challenge:** the room creator can add an optional challenge for
  whoever finishes last ("The loser drinks 2 bottles of water"). Anyone
  joining sees it in a pop-up first and is only added to the room if they
  agree (the server refuses joins that haven't accepted it). It shows in
  the lobby; after the last round the final screen shows the top 5 and who
  the challenge falls on (everyone tied on the lowest score; nobody if all
  players tie). A "Challenge rules" link explains it must stay legal and
  never involve money; challenges mentioning money or bets are refused, and
  the Terms (section 4c) cover it.
- **Sponsors & prizes:** the admin dashboard's Sponsors section creates
  campaigns (logo, prize, dates, optional sponsored category, prize codes).
  When a campaign is live, the room creator chooses "Just for fun" or
  "Real prizes" (and which sponsor); the option is hidden when no campaign
  is running. Prize rooms show the sponsor; the winner of an
  eligible game (minimum players and rounds) gets the next unused code, one
  prize per player per campaign, and can leave an email (with consent) for
  delivery. Each campaign has a rules page (`/rules.html?c=<id>`) and a
  report (rooms, players reached, games, prizes, codes left, site visits,
  answers collected). A campaign can have up to 3 sponsored categories,
  played one per round in turn (round 1 the first, round 2 the second…);
  **Generate** fills one with a ready-made question about the sponsor's
  products ("Best product to buy at …", "Worst product you bought at …",
  "A product you'd recommend from …"). Each can be checked as "Any real
  product or thing" (the answer only has to exist on Wikidata). Every answer
  given in them is saved without player
  names; the campaign card downloads them as a full list or a summary (how
  often each answer was given), and `npm run export-data` keeps them in
  `admin-data/all-sponsor-answers.csv`. See `netlify/lib/sponsors.mjs`.
