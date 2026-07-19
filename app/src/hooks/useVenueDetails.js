import { useEffect, useState } from "react";
import baked from "../data/venueDetails.json";

const CACHE_KEY = "roadtrip.venuedetails.v2";

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // cache full — details just refetch
  }
}

async function fetchWikiSummary(title) {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );
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

async function searchWikiTitle(query) {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&srlimit=1&format=json&origin=*`
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.query?.search?.[0]?.title || null;
}

async function fetchAddress(wp) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${wp.lat}&lon=${wp.lng}&zoom=16&addressdetails=1`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.address) return json.display_name || null;
  const a = json.address;
  const parts = [
    a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
    a.hamlet || a.village || a.town || a.city,
    a.county,
    a.postcode,
  ].filter(Boolean);
  return parts.join(", ") || json.display_name || null;
}

/**
 * On-demand venue enrichment for the detail modal: Wikipedia summary + image
 * and a human-readable address from Nominatim. Cached in localStorage.
 */
export function useVenueDetails(wp) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wp) {
      setDetails(null);
      return;
    }
    // Content shipped with the app (see scripts/fetch-venue-details.mjs)
    if (baked[wp.id]) {
      setDetails(baked[wp.id]);
      return;
    }
    const cache = loadCache();
    if (cache[wp.id]) {
      setDetails(cache[wp.id]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setDetails(null);
    (async () => {
      const [wikiResult, address] = await Promise.all([
        (async () => {
          let wiki = wp.wikiTitle ? await fetchWikiSummary(wp.wikiTitle).catch(() => null) : null;
          if (!wiki) {
            const found = await searchWikiTitle(wp.name).catch(() => null);
            if (found) wiki = await fetchWikiSummary(found).catch(() => null);
          }
          return wiki;
        })(),
        fetchAddress(wp).catch(() => null),
      ]);
      if (cancelled) return;
      const result = { wiki: wikiResult, address };
      const freshCache = loadCache();
      freshCache[wp.id] = result;
      saveCache(freshCache);
      setDetails(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [wp]);

  return { details, loading };
}
