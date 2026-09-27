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

This app needs a host that keeps a **persistent WebSocket connection** open
(not a serverless/edge platform like Vercel's default functions). Good free
options:

### Render.com (recommended, easiest)

1. Push this folder to a GitHub repo.
2. On [render.com](https://render.com), click **New \+ Web Service**, connect
   the repo.
3. Build command: `npm install`  Start command: `npm start`
4. Deploy. Render gives you a public `https://your-app.onrender.com` URL &mdash;
   share that with friends.

### Railway.app / Fly.io

Both work the same way: point them at this repo, they auto-detect Node,
`npm start` boots the server, you get a public URL.

> Free tiers on these platforms may sleep the server after inactivity, which
> just means the first join after a while takes a few extra seconds to wake
> up &mdash; the game itself isn't affected once everyone's connected.

## How a game works

1. One player creates a room (sets round length & categories per round) and
   gets a 4-character room code.
2. Everyone else joins with that code and a name &mdash; own phone, own screen.
3. The host starts the game: everyone gets the same random letter and
   category list, and a synchronized countdown begins.
4. When time's up, every player's answers are revealed to the whole group at
   once, scored automatically (unique valid answer = 10 pts, an answer two or
   more players share = 0 pts for all of them, blank or wrong-letter = 0).
5. The round's top scorer picks the next letter. The moment they pick it, the
   next round starts for everyone at the same time.
6. Total scores carry across rounds &mdash; play as many rounds as you like.

## Notes

- State lives in server memory (no database) &mdash; a server restart clears any
  rooms in progress. Fine for a live party game; not meant for long-term
  persistence.
- Category bank and the 20 built-in prompts live in `server.js`
  (`CATEGORY_BANK`) &mdash; edit that array to add or change categories.
