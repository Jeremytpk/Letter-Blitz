# Letter Blitz

A live, by-letter party game. The group gets a letter (e.g. **L**), and everyone
races to fill every category &mdash; country, boy's name, girl's name, celebrity,
capital city, and more &mdash; with a word that starts with that letter before the
clock runs out. Answers are revealed to everyone at once; a matching answer
between two players scores nobody, a unique valid answer scores 10. Whoever
scored highest that round picks the next letter, and every player's screen
gets the green light together when the next round starts.

No sign-up: players just type a name to join. Real-time sync is powered by a
small Node + Socket.IO server, so everyone needs the app open at the same URL.

## Run it locally

```bash
npm install
npm start
```

Open `http://localhost:3000` on your own machine.

**To play with friends on the same WiFi** (e.g. everyone in the same room),
find your computer's local IP address and share `http://<that-ip>:3000`
instead of `localhost`:

- Mac: `ipconfig getifaddr en0` (or `en1` on Wi-Fi-only Macs)
- Windows: `ipconfig` and look for "IPv4 Address"

Everyone on the same network can then open that address on their phone.

## Deploy it so anyone can join from anywhere

The app has two parts:

- **Frontend** (`public/`) &mdash; static files, hosted on **Netlify**.
- **Game server** (`server.js`) &mdash; keeps a live WebSocket open to every
  player, so it needs a host that runs a long-lived Node process. Netlify
  can't do that, so the server runs on **Render** (free).

### 1. Game server on Render

1. On [render.com](https://render.com), click **New \+ Blueprint** (or
   **Web Service**) and connect this GitHub repo. `render.yaml` sets it up:
   build `npm install`, start `npm start`.
2. Deploy and copy the URL, e.g. `https://letter-blitz.onrender.com`.
3. Optional: set the env var `ALLOWED_ORIGINS` to your Netlify URL
   (e.g. `https://letter-blitz.netlify.app`) so only your site can connect.

### 2. Frontend on Netlify

1. On [netlify.com](https://netlify.com), **Add new site \+ Import from Git**
   and pick this repo. `netlify.toml` already sets the publish folder.
2. In **Site configuration \+ Environment variables**, add
   `GAME_SERVER_URL` = your Render URL from step 1.
3. Deploy (or redeploy after adding the variable). Share the Netlify URL
   with everyone.

> Render's free tier sleeps after inactivity, so the first player to open
> the site after a while may wait ~30 seconds for it to wake up.

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
  category ("Ghana" passes as a food). Players still judge that part.
  If Wikipedia can't be reached, answers get the benefit of the doubt.
  Set `WIKI_LANGS` (default `en,fr`) on the server to change languages.

- State lives in server memory (no database) &mdash; a server restart clears any
  rooms in progress. Fine for a live party game; not meant for long-term
  persistence.
- Category bank and the 20 built-in prompts live in `server.js`
  (`CATEGORY_BANK`) &mdash; edit that array to add or change categories.
