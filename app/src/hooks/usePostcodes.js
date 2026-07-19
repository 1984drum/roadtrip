import { useEffect, useState } from "react";
import { allWaypoints } from "../data/routeData";
import { optionalSites } from "../data/optionalSites";

const allPois = [...allWaypoints, ...optionalSites];

const CACHE_KEY = "roadtrip.postcodes.v2";

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

async function lookupPostcode(wp) {
  // Nearest postcode within 2km; falls back to a wide (~20km) search for
  // remote spots like Valley of Rocks or Lud's Church.
  const base = "https://api.postcodes.io/postcodes";
  const near = `${base}?lon=${wp.lng}&lat=${wp.lat}&radius=2000&limit=1`;
  const wide = `${base}?lon=${wp.lng}&lat=${wp.lat}&wideSearch=true&limit=1`;
  for (const url of [near, wide]) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const hit = json.result?.[0];
      if (hit) {
        return {
          postcode: hit.postcode,
          approx: url === wide,
          district: hit.admin_district,
        };
      }
    } catch {
      // try next strategy
    }
  }
  return null;
}

/**
 * Resolves the nearest UK postcode for every waypoint (for punching into
 * the car's sat nav). Returns a map of waypointId -> {postcode, approx, district}.
 */
export function usePostcodes() {
  const [postcodes, setPostcodes] = useState(() => loadCache());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cache = loadCache();
      let dirty = false;
      for (const wp of allPois) {
        if (cache[wp.id]) continue;
        const result = await lookupPostcode(wp);
        if (result) {
          cache[wp.id] = result;
          dirty = true;
          if (!cancelled) setPostcodes({ ...cache });
        }
      }
      if (dirty) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch {
          // non-fatal
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return postcodes;
}
