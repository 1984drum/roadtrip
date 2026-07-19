/* Road Trip service worker — offline app shell + map tile cache.
   Bump VERSION to invalidate the app cache after breaking changes. */
const VERSION = "v2";
const APP_CACHE = `roadtrip-app-${VERSION}`;
const TILE_CACHE = "roadtrip-tiles"; // shared with the in-app tile downloader
const EXT_CACHE = "roadtrip-ext";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("roadtrip-app-") && k !== APP_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function cacheFirst(event, cacheName) {
  event.respondWith(
    caches.match(event.request).then(
      (hit) =>
        hit ||
        fetch(event.request).then((res) => {
          if (res && (res.ok || res.type === "opaque")) {
            const clone = res.clone();
            caches.open(cacheName).then((c) => c.put(event.request, clone));
          }
          return res;
        })
    )
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // SPA navigations: try the network for fresh deploys, fall back to cached shell
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(APP_CACHE).then((c) => c.put("./index.html", clone));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Own hashed assets: immutable, cache-first
  if (url.origin === self.location.origin) return cacheFirst(event, APP_CACHE);

  // Map tiles (all base layers): cache-first (also fed by the bulk downloader)
  if (
    url.hostname.endsWith("basemaps.cartocdn.com") ||
    url.hostname.endsWith("arcgisonline.com") ||
    url.hostname.endsWith("opentopomap.org")
  )
    return cacheFirst(event, TILE_CACHE);

  // Fonts + Wikipedia images
  if (
    url.hostname === "upload.wikimedia.org" ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  )
    return cacheFirst(event, EXT_CACHE);

  // Everything else (OSRM, postcodes.io, Nominatim, Wikipedia API) stays network-only —
  // those responses are cached at the app layer in localStorage / baked JSON.
});
