# Road Trip — Project Handoff

**Live app:** https://roadtrip.1984drum.com
**Repo:** https://github.com/1984drum/roadtrip (public — required for free GitHub Pages)
**Local:** `E:\_CLAUDE\roadtrip`
**Last updated:** 19 July 2026

A mobile-first PWA for a 6-leg EV road trip, Macclesfield ⇄ Devon, threading
Tesla Superchargers, YHA stays, medieval ruins and landscapes. Grew from the
single-file prototype in `original/`.

---

## Repository layout

| Path | What |
|---|---|
| `app/` | Vite + React + Leaflet app (plain JS, no TS) |
| `app/src/data/routeData.js` | 15 legs (each OSRM-verified ≤2h15m driving), 40 main waypoints |
| `app/src/data/optionalSites.js` | 14 optional POIs (grey markers), Nominatim-verified coords |
| `app/src/lib/router.js` | Routing with motorway preference: OSRM ("yes") / FOSSGIS Valhalla use_highways ("sometimes"/"no") |
| `app/src/data/venueDetails.json` | Baked Wikipedia summaries/images + OSM addresses for all 54 POIs |
| `app/scripts/fetch-venue-details.mjs` | Re-bakes venueDetails.json — **run after changing any POI** |
| `app/public/sw.js` | Hand-rolled service worker — **bump `VERSION` on breaking cache changes** |
| `worker/` | Cloudflare Worker: sync KV store + Anthropic AI proxy |
| `original/` | The original HTML prototype (reference only) |
| `.github/workflows/deploy.yml` | Build + deploy to GitHub Pages on push to `main` |

## Accounts & deployment

- **GitHub:** repo on **1984drum** account. This machine has 3 gh accounts
  (auntiedrum = default active, 1984drum, petermcclorycom). The repo has a
  **repo-local** credential helper (`!gh auth git-credential`) so pushes use
  whichever gh account is active — run `gh auth switch --user 1984drum`
  before pushing if pushes 403.
- **Deploy app:** just push to `main`. Actions builds `app/` and publishes to
  Pages (~1 min). Custom domain via `app/public/CNAME`; DNS for
  `*.1984drum.com` already points at GitHub Pages (185.199.x.x). HTTPS enforced.
- **Cloudflare:** worker `roadtrip-sync` on the **auntiedrum@gmail.com**
  account → https://roadtrip-sync.auntiedrum.workers.dev, KV namespace SYNC
  (id `0e380d784f4949cbbdd56c47900d047b`). Deploy: `cd worker && npx wrangler deploy`.
  URL is baked into `app/src/lib/cloudSync.js`.

## Feature inventory

- Real road routing per leg (OSRM public server, localStorage-cached, dashed
  straight-line fallback), tappable route lines with distance/driving time.
- 54 POIs: filters, grey optional sites & pubs toggle, detail modal (baked
  wiki photo/summary, address, tap-to-copy postcode, official website,
  Navigate/Reviews links, share).
- Star ratings 1–10 per POI (localStorage) + "My Route" builder: optimised
  loop through places rated ≥ threshold (NN + 2-opt, chargers optionally
  always included), gold line with numbered stops.
- **Sketch mode:** "✏ Sketch route" drops 6 draggable handles (S/20/40/60/80/E%)
  on the current route; Build turns the sketch into a real OSRM route.
- Saved named routes (POI-id based or raw sketch points), load/delete.
- A4 printing: per-leg sheets and custom-route sheets with photos (browser
  print → save as PDF).
- Base layers: CARTO Voyager (default), Esri satellite, OpenTopoMap terrain,
  CARTO dark. Map bounded to England, half-step zoom.
- GPS tracking with follow mode, speed, distance to nearest stop/charger.
- Offline PWA: SW caches shell/assets/tiles; "Offline maps" bulk-downloads
  the route corridor (~2,200 tiles / ~40 MB), auto-start on unmetered
  connections; installable (manifest + icons).
- Auto-sync: Cloudflare KV via secret sync code, debounced push / pull-merge
  on open, pair links (`#pair=<code>`); manual `#sync=` links and JSON
  file export/import as fallback.
- AI route assistant: **hidden** (see below) but fully built.

## Dormant: AI assistant

UI is gated behind `{false && ...}` in `App.jsx` (search "AI route assistant
on hold"). Worker `/ai` endpoint is live but returns 503 until the secret is
set: `cd worker && npx wrangler secret put ANTHROPIC_API_KEY` (owner runs
this; key never in repo). Proxy requires a registered sync code, locks model
to Haiku, caps tokens. BYO-key fallback also exists in `AssistantPanel.jsx`.

## localStorage keys (per browser)

`roadtrip.ratings.v1` · `roadtrip.savedroutes.v1` · `roadtrip.synccode.v1` ·
`roadtrip.osrm.v1` · `roadtrip.postcodes.v2` · `roadtrip.venuedetails.v2` ·
`roadtrip.offline.meta.v1` · `roadtrip.offline.auto` · `roadtrip.baselayer.v1` ·
`roadtrip.anthropic.key` (only if BYO key used)

## External services (all free, no keys except dormant AI)

OSRM demo router · postcodes.io · Nominatim (reverse + coord verification) ·
Wikipedia REST (baked at build time) · CARTO / Esri / OpenTopoMap tiles ·
Cloudflare Workers+KV free tier · Anthropic API (dormant).

## Known issues / next steps

1. ~~Leg time estimates stale~~ **Fixed 20 Jul 2026**: trip restructured into
   15 legs, each verified against real OSRM driving times (≤2h + 15m grace;
   only leg 7 sits at exactly 2h15). Planner header has min/max drive-time
   spec selects (badges flag legs vs spec) and a motorways yes/sometimes/no
   preference (Valhalla's B-road times run ~40-60% over OSRM's — treat "no"
   mode times as pessimistic).
2. **YHA Slimbridge & YHA Exford** hostel pages redirect to yha.org.uk home —
   the hostels may no longer operate. Verify before booking; replace stops if
   needed (then re-run fetch-venue-details + postcodes cache bump).
3. **Sketch drag on a real touchscreen** — verified with simulated mouse input
   only; give it a real thumb test.
4. Satellite/terrain layers aren't bulk-downloaded for offline (licensing) —
   they cache only as browsed; offline baseline is always CARTO colour/dark.
5. Postcodes still resolve at runtime on first visit — could be baked into
   the repo like venueDetails (same pattern).
6. Sync merge is coarse (imported-wins per rating, union of routes) — fine
   for 1–2 users; would need timestamps for real conflict resolution.
7. `#sync=`/`#pair=` confirm dialogs use `window.confirm` — plain but works.

## Development

```bash
cd app && npm install && npm run dev    # http://localhost:5173
npm run build                           # dist/
node scripts/fetch-venue-details.mjs    # re-bake wiki/address data
cd ../worker && npx wrangler deploy     # worker changes
```

Dev server config for the in-app preview lives in `.claude/launch.json`
(name: `roadtrip-dev`). Service worker runs in production builds only.
