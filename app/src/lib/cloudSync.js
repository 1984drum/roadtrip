// Auto-sync client for the Cloudflare Worker (worker/ in this repo).
// WORKER_URL is baked in after `wrangler deploy`; everything no-ops while
// it's empty so the app works fine without the worker.
import { collectSyncPayload, applyImport } from "./syncData";

export const WORKER_URL = "https://roadtrip-sync.auntiedrum.workers.dev";

const CODE_KEY = "roadtrip.synccode.v1";

export const cloudAvailable = () => WORKER_URL.startsWith("https://");

export function getSyncCode() {
  return localStorage.getItem(CODE_KEY) || null;
}

export function setSyncCode(code) {
  localStorage.setItem(CODE_KEY, code);
}

export function newSyncCode() {
  const code = `${crypto.randomUUID()}-${crypto.randomUUID().slice(0, 8)}`;
  setSyncCode(code);
  return code;
}

export function disableSync() {
  localStorage.removeItem(CODE_KEY);
}

export async function pullCloud(code) {
  const res = await fetch(`${WORKER_URL}/sync/${code}`);
  if (!res.ok) throw new Error(`sync pull failed (${res.status})`);
  return res.json(); // payload or null
}

export async function pushCloud(code) {
  const res = await fetch(`${WORKER_URL}/sync/${code}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(collectSyncPayload()),
  });
  if (!res.ok) throw new Error(`sync push failed (${res.status})`);
}

/** Pull remote state and merge it into local storage.
    Returns true if local data changed (caller should reload state). */
export async function pullAndMerge(code) {
  const remote = await pullCloud(code);
  if (!remote) return false;
  const before = JSON.stringify(collectSyncPayload());
  applyImport(remote);
  return JSON.stringify(collectSyncPayload()) !== before;
}

export function buildPairUrl(code) {
  return `${location.origin}${location.pathname}#pair=${code}`;
}

export function parsePairFragment(hash) {
  const m = /#pair=([A-Za-z0-9-]{20,80})/.exec(hash);
  return m ? m[1] : null;
}

/** Call the AI proxy (no API key needed on-device). */
export async function proxyChat(code, system, messages) {
  const res = await fetch(`${WORKER_URL}/ai`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-sync-code": code },
    body: JSON.stringify({ system, messages, max_tokens: 1000 }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message || json?.error || `AI proxy error ${res.status}`);
  return json.content?.map((b) => b.text || "").join("") || "";
}
