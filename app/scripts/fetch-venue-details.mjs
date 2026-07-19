// Bakes Wikipedia summaries/images and Nominatim addresses for every POI
// into src/data/venueDetails.json so the app ships with the content included.
// Re-run whenever POIs change:  node scripts/fetch-venue-details.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "src", "data");
const outFile = join(dataDir, "venueDetails.json");

const { routeData } = await import(new URL("../src/data/routeData.js", import.meta.url));
const { optionalSites } = await import(new URL("../src/data/optionalSites.js", import.meta.url));

const pois = [...routeData.flatMap((l) => l.waypoints), ...optionalSites];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = "roadtrip-app-bake/1.0 (personal road trip planner)";

let existing = {};
try {
  existing = JSON.parse(readFileSync(outFile, "utf-8"));
} catch {
  /* first run */
}

async function wikiSummary(title, attempt = 0) {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: { "User-Agent": UA } }
  );
  if (res.status === 429 && attempt < 3) {
    const wait = Math.min(Number(res.headers.get("retry-after")) || 30, 60);
    process.stdout.write(`[429, waiting ${wait}s] `);
    await sleep(wait * 1000);
    return wikiSummary(title, attempt + 1);
  }
  if (!res.ok) return null;
  const json = await res.json();
  if (json.type === "disambiguation") return null;
  return {
    extract: json.extract || null,
    image: json.originalimage?.source || json.thumbnail?.source || null,
    url: json.content_urls?.desktop?.page || null,
    title: json.title,
  };
}

async function wikiSearch(query, attempt = 0) {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`,
    { headers: { "User-Agent": UA } }
  );
  if (res.status === 429 && attempt < 3) {
    const wait = Math.min(Number(res.headers.get("retry-after")) || 30, 60);
    process.stdout.write(`[search 429, waiting ${wait}s] `);
    await sleep(wait * 1000);
    return wikiSearch(query, attempt + 1);
  }
  if (!res.ok) return null;
  const json = await res.json();
  return json.query?.search?.[0]?.title || null;
}

async function address(wp) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${wp.lat}&lon=${wp.lng}&zoom=16&addressdetails=1`,
    { headers: { "User-Agent": UA } }
  );
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.address) return json.display_name || null;
  const a = json.address;
  return (
    [
      a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
      a.hamlet || a.village || a.town || a.city,
      a.county,
      a.postcode,
    ]
      .filter(Boolean)
      .join(", ") || json.display_name || null
  );
}

const out = { ...existing };
for (const wp of pois) {
  if (out[wp.id]?.wiki && out[wp.id]?.address) continue; // already baked
  process.stdout.write(`${wp.id} (${wp.name}) ... `);
  let wiki = wp.wikiTitle ? await wikiSummary(wp.wikiTitle).catch(() => null) : null;
  if (!wiki) {
    const found = await wikiSearch(wp.name).catch(() => null);
    if (found) wiki = await wikiSummary(found).catch(() => null);
  }
  const addr = await address(wp).catch(() => null);
  out[wp.id] = { wiki, address: addr };
  console.log(`${wiki ? "wiki✓" : "wiki✗"} ${addr ? "addr✓" : "addr✗"}`);
  await sleep(1100); // Nominatim rate limit: max 1 req/sec
}

writeFileSync(outFile, JSON.stringify(out, null, 2), "utf-8");
console.log(`\nWrote ${Object.keys(out).length} entries to ${outFile}`);
