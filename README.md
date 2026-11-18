# SYNERGY 2026 · United University

Website for SYNERGY 2026, the annual fest of United University, Prayagraj (5–6 December 2026, with Sachin-Jigar live at Star Night on 6 December).

Live site: https://ashutosh26-uu.github.io/senergy2026/

## Stack

- **React 18** + **Vite**
- **React Three Fiber** (`@react-three/fiber`, `drei`, `postprocessing`) for the real-time 3D concert stage the camera flies through as you scroll
- Plain CSS (`src/styles.css`)

## What's inside

- 3D stage with moving-head lights, lasers, an LED wall, a crowd that bounces on a 126 BPM beat, and bloom (desktop)
- Countdown, SYNERGY 2026 events with search, day filters, saved picks, live registration deadlines, a schedule view, add-to-calendar and share
- Star Night, past editions (glimpses + full SYNERGY 2025 / 2024 galleries), campus photo ring, venue map and contact

## Project layout

```
src/
  App.jsx              page shell, lazy-loads the 3D stage
  three/Stage.jsx      the 3D stage (React Three Fiber)
  three/shared.js      scroll/pointer state shared with the stage
  components/          sections (Events2026, Archive, Venue, CampusRing, ...) and shared UI (viewer, modal, toast)
  data/                events, galleries and site settings
public/assets/         photos, flyers and logos (served as-is)
```

Event details live in `src/data/events2026.js`; fest dates in `src/data/site.js`.

## Develop

```bash
npm install
npm run dev
```

Then open http://localhost:5173/senergy2026/

## Deploy

Every push to `main` builds the site and publishes it to GitHub Pages through `.github/workflows/deploy.yml` (Pages source: GitHub Actions).

## Credits

Photos, flyers and videos: United University, Prayagraj. Sachin-Jigar photo: Bollywood Hungama, CC BY 3.0 (via Wikimedia Commons).

Built by [REASONATEAI](https://reasonateai.com/).
