# 🌍 GeoGuessr.lol

> *Built as a free alternative to the original. No subscription. No paywalls. Just geography.*

A free, open-source geography guessing game. Drop into random Street View locations around the world and guess where you are — scored by distance.

Live at [geoguessr.lol](https://geoguessr.lol)

---

## Features

- 🌍 **Street View gameplay** — explore and guess locations from real street-level imagery
- 🎯 **Distance-based scoring** — up to 5000 points per round based on how close you are
- ⏱️ **Round timer** — optional time pressure from 60 to 180 seconds
- 🗺️ **Region selection** — World, Europe, Asia, Americas, Africa
- 👤 **User accounts** — register, log in, and track your progress
- 📊 **Stats & history** — average score, best game, average distance, full game history
- 🚩 **Flag quiz** *(coming soon)*
- 🗺️ **Border quiz** *(coming soon)*
- 🎉 **Party mode** *(coming soon)* — play with friends in real-time

---

## Tech Stack

- **Framework** — Next.js 14 (App Router)
- **Auth** — NextAuth.js
- **Database** — Prisma + SQLite (dev) / PostgreSQL (prod)
- **Maps** — Google Maps JavaScript API + Street View
- **Styling** — Tailwind CSS
- **State** — Zustand

---

## Self-Hosting

### Prerequisites

- Node.js 18+
- Google Maps API key 
- Enable: **Maps JavaScript API** and **Street View Static API**

### Setup

```bash
git clone https://github.com/Julle98/geoguessr.lol
cd geoguessr.lol
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL="file:./prisma/dev.db"
```

Generate a secret:
```bash
openssl rand -base64 32
```

Initialize the database:
```bash
npx prisma migrate dev --name init
```

Run:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Scoring

Same formula as the original — exponential decay based on distance:

| Distance | Score |
|----------|-------|
| < 1 km | ~5000 |
| 50 km | ~3882 |
| 500 km | ~2131 |
| 2000 km | ~1839 |
| 5000 km | ~822 |
| > 10 000 km | < 100 |

---

## Roadmap

- [x] Street View gameplay
- [x] Distance scoring
- [x] User accounts & authentication
- [x] Game history & statistics
- [x] Leaderboards
- [ ] Flag quiz
- [ ] Border quiz
- [ ] Party mode (real-time multiplayer)
- [ ] Custom map regions
- [ ] Mobile app

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## License

MIT — do whatever you want, just don't charge people a monthly fee for it. 

See the [LICENSE](LICENSE) file for full details.

---

## Credits

Created by Julle98 with assistance from Claude.