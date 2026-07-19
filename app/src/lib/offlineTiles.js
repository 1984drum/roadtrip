// Bulk map-tile downloader for offline use. Computes every tile along the
// route corridor (zooms 7-13, one-tile margin) plus close-up rings around
// each POI (zoom 14), and fetches them into the same Cache Storage bucket
// the service worker serves tiles from.
import L from "leaflet";
import { routeData, legRoutingCoords } from "../data/routeData";
import { allPois } from "./customRoute";

const TILE_CACHE = "roadtrip-tiles";
export const META_KEY = "roadtrip.offline.meta.v1";

function tileXY(lat, lng, z) {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return [x, y];
}

/** Every tile key ("z/x/y") needed to cover the trip offline. */
export function computeTileList(routes) {
  const keys = new Set();
  const lines = routeData.map((leg) => routes[`leg${leg.id}`]?.line || legRoutingCoords(leg));
  for (let z = 7; z <= 13; z++) {
    for (const line of lines) {
      for (const [lat, lng] of line) {
        const [x, y] = tileXY(lat, lng, z);
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++) keys.add(`${z}/${x + dx}/${y + dy}`);
      }
    }
  }
  for (const p of allPois) {
    const [x, y] = tileXY(p.lat, p.lng, 14);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) keys.add(`14/${x + dx}/${y + dy}`);
  }
  return [...keys];
}

/** Mirrors Leaflet's subdomain pick and retina suffix so cache keys match. */
export function tileUrl(key) {
  const [z, x, y] = key.split("/").map(Number);
  const s = "abcd"[Math.abs(x + y) % 4];
  const r = L.Browser.retina ? "@2x" : "";
  return `https://${s}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}${r}.png`;
}

export function estimateBytes(count) {
  return count * (L.Browser.retina ? 32000 : 16000);
}

export async function downloadTiles(keys, onProgress, signal) {
  const cache = await caches.open(TILE_CACHE);
  let done = 0;
  let bytes = 0;
  let failed = 0;
  const queue = [...keys];

  async function worker() {
    while (queue.length) {
      if (signal?.aborted) return;
      const key = queue.shift();
      const url = tileUrl(key);
      try {
        if (!(await cache.match(url))) {
          let res;
          try {
            res = await fetch(url);
          } catch {
            res = await fetch(url, { mode: "no-cors" });
          }
          if (res && (res.ok || res.type === "opaque")) {
            bytes += Number(res.headers.get("content-length")) || 16000;
            await cache.put(url, res);
          } else {
            failed++;
          }
        }
      } catch {
        failed++;
      }
      done++;
      if (done % 25 === 0 || done === keys.length) onProgress({ done, total: keys.length, bytes, failed });
    }
  }

  await Promise.all(Array.from({ length: 6 }, worker));
  onProgress({ done, total: keys.length, bytes, failed });
  return { done, bytes, failed };
}

export async function clearTiles() {
  await caches.delete(TILE_CACHE);
  localStorage.removeItem(META_KEY);
}
