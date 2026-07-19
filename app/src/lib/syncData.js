// Backup & cross-device sync without a backend: everything personal
// (ratings + saved routes) packs into a compact URL fragment or a JSON file.

const RATINGS_KEY = "roadtrip.ratings.v1";
const ROUTES_KEY = "roadtrip.savedroutes.v1";

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function collectSyncPayload() {
  return {
    v: 1,
    ratings: read(RATINGS_KEY) || {},
    savedRoutes: read(ROUTES_KEY) || [],
  };
}

function toBase64Url(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(b64) {
  const pad = b64.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(pad)));
}

export function buildSyncUrl() {
  const data = toBase64Url(JSON.stringify(collectSyncPayload()));
  return `${location.origin}${location.pathname}#sync=${data}`;
}

export function parseSyncFragment(hash) {
  const m = /#sync=([A-Za-z0-9_-]+)/.exec(hash);
  if (!m) return null;
  try {
    const payload = JSON.parse(fromBase64Url(m[1]));
    if (payload?.v !== 1) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Merge an imported payload into local storage. Imported values win for
    ratings; routes merge by id (imported first). Returns a summary. */
export function applyImport(payload) {
  const ratings = { ...(read(RATINGS_KEY) || {}), ...(payload.ratings || {}) };
  const existing = read(ROUTES_KEY) || [];
  const existingIds = new Set(existing.map((r) => r.id));
  const merged = [...(payload.savedRoutes || []).filter((r) => !existingIds.has(r.id)), ...existing];
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  localStorage.setItem(ROUTES_KEY, JSON.stringify(merged));
  return {
    ratings: Object.keys(payload.ratings || {}).length,
    routes: (payload.savedRoutes || []).length,
  };
}

export function downloadBackup() {
  const blob = new Blob([JSON.stringify(collectSyncPayload(), null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "roadtrip-backup.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importBackupFile(file) {
  return file.text().then((text) => {
    const payload = JSON.parse(text);
    if (payload?.v !== 1) throw new Error("Not a Road Trip backup file");
    return applyImport(payload);
  });
}
