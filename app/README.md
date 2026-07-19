# Road Trip — Macclesfield ⇄ Devon EV Road Trip

Live at https://roadtrip.1984drum.com (auto-deploys from `main` via GitHub Actions).
See [../HANDOFF.md](../HANDOFF.md) for the full project handoff: accounts,
deployment, feature inventory, storage keys and known issues.

Mobile-first React web app for a 6-leg Tesla road trip from Macclesfield to the
North Devon coast and back, threading Tesla Superchargers, YHA stays, medieval
ruins and rugged landscapes. Built out from the original single-file prototype
in `../original/`.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production bundle in dist/
```

To use it on your phone on the same network: `npm run dev -- --host` and open
the Network URL shown. (GPS requires HTTPS or localhost — for real on-the-road
use, deploy to any static host, e.g. Netlify/Vercel/Cloudflare Pages.)

## Features

- **Real road routing** — each leg's geometry is fetched from the public OSRM
  server (`router.project-osrm.org`) and drawn along actual roads, with live
  distance/driving-time per leg. Results are cached in `localStorage`; if OSRM
  is unreachable a dashed straight line is shown as fallback.
- **Postcodes for sat nav** — every waypoint resolves its nearest UK postcode
  via `postcodes.io`. Tap the postcode chip (sidebar or map popup) to copy it
  for the car. `≈` marks wide-area matches for remote spots (e.g. Lud's
  Church) where the nearest postcode is further away.
- **GPS tracking** — "Track me" uses `watchPosition` to show your live
  position with an accuracy ring, optional follow-me map centring, current
  speed, and live distance to the nearest waypoint and nearest Supercharger.
- **Interactive map** — dark CARTO tiles, filterable markers (historical /
  nature / chargers / lodging), leg cards that zoom the map to the leg,
  waypoint rows that fly to the stop and open its popup, per-stop
  "Navigate ↗" deep link into Google Maps directions.
- **Mobile layout** — full-screen map with a bottom sheet; desktop gets the
  classic sidebar + legend.
- **Tappable route lines** — tap any leg's line on the map to see its real
  routed distance and non-stop driving time.
- **Optional sites & pubs** — 34 grey markers for extra castles, abbeys, stone
  circles, viewpoints and historic pubs near the route (coordinates verified
  against OpenStreetMap), toggleable with the "Extras" chip and included in
  the Pubs/Historical/Nature filters.
- **Detail modal** — tap any marker (or a waypoint in the sidebar) for a full
  card: live Wikipedia photo + summary, address from OpenStreetMap/Nominatim,
  sat nav postcode, coordinates, Navigate/Reviews links, and a Share button
  (native share sheet on mobile, clipboard fallback on desktop).
- **A4 leg sheets** — the "🖨 PDF" button on each leg card opens a
  print-optimised A4 itinerary (route sketch, stops with postcodes and
  coordinates, optional detours nearby) — print it or save as PDF to share.
- **Star ratings & personalised route** — rate any stop 1–10 in its modal
  (stored on-device); the "★ My Route" section builds an optimised loop
  through everything rated above your chosen threshold (2-opt ordering +
  OSRM), optionally always including Superchargers.
- **Offline / PWA** — a service worker caches the app shell, and the
  "Offline maps" section bulk-downloads ~2,200 map tiles covering the route
  corridor (z7–13 + close-up rings at every stop, ~40 MB), auto-starting on
  unmetered connections. Installable to the home screen. Re-run
  `scripts/fetch-venue-details.mjs` after changing POIs so place info stays
  baked into the bundle.
- **Sketch mode** — "✏ Sketch route" drops six draggable handles (start,
  20–80%, end) on the current route; drag them anywhere and Build converts
  the sketch into a real OSRM road route.
- **Base layers** — coloured CARTO Voyager (default), Esri satellite,
  OpenTopoMap terrain, or dark; map bounded to England with half-step zoom.
- **Saved routes & auto-sync** — name and save any custom/sketched route;
  ratings and routes sync across devices via a Cloudflare Worker + KV
  (`../worker/`) using a private sync code and pair links, with sync-link /
  JSON-file backup as fallback.

## Architecture

```
src/
  data/routeData.js       # legs, waypoints, stop order for routing chain
  hooks/useRoutes.js      # OSRM fetch + localStorage cache
  hooks/usePostcodes.js   # postcodes.io reverse geocoding + cache
  hooks/useGeolocation.js # watchPosition wrapper + distance helpers
  components/MapView.jsx  # Leaflet map (markers, routes, GPS layer)
  components/LegCard.jsx  # sidebar leg card with waypoints + postcodes
  App.jsx / App.css       # layout, filters, GPS controls, bottom sheet
```

No API keys required — OSRM demo server, postcodes.io and CARTO tiles are all
free/open endpoints.

## Roadmap ideas (for the full spec)

1. **PWA / offline** — service worker + cached tiles along the route corridor
   so the app works in Exmoor's signal dead zones; installable to home screen.
2. **Route progress** — snap the GPS fix to the route line and show "12 mi to
   Valley of Rocks · leg 3 of 6, 64% complete" rather than crow-flies nearest.
3. **Charging planner** — battery % input per leg, estimated consumption
   (kWh/mi with elevation), and a warning when a leg outruns the range buffer.
4. **Live Supercharger status** — stall availability/pricing (needs Tesla API
   or a third-party source; worth a spike).
5. **GPX/KML export** — one tap to export the whole route or a leg for the
   car, a Garmin, or OsmAnd.
6. **Trip journal** — tick off waypoints as visited, attach photos/notes,
   persisted locally (or synced if we add a backend).
7. **Weather overlay** — Open-Meteo forecast per waypoint for the planned
   arrival time.
8. **Editable itinerary** — drag waypoints to reorder, add custom stops by
   tapping the map, with routes re-fetched automatically.
9. **Opening hours & booking links** — English Heritage/YHA links with
   open/closed state for the planned arrival day.
10. **Share view** — read-only live-location share link so family can follow
    the trip.
