import { useEffect, useState } from "react";
import { routeData, legRoutingCoords } from "../data/routeData";

const CACHE_KEY = "roadtrip.osrm.v1";

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
    // storage full or unavailable — routes just refetch next visit
  }
}

async function fetchLegRoute(coords) {
  // OSRM wants lng,lat pairs
  const pairs = coords.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${pairs}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const json = await res.json();
  if (json.code !== "Ok" || !json.routes?.length) throw new Error("No route");
  const route = json.routes[0];
  return {
    // back to [lat, lng] for Leaflet
    line: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceM: route.distance,
    durationS: route.duration,
  };
}

/**
 * Fetches real road geometry for every leg from the public OSRM server,
 * cached in localStorage. Returns { routes: {legId: {line, distanceM, durationS}}, loading, error }.
 */
export function useRoutes() {
  const [routes, setRoutes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cache = loadCache();
      const result = {};
      let failed = 0;

      for (const leg of routeData) {
        const coords = legRoutingCoords(leg);
        const key = `leg${leg.id}:${coords.map((c) => c.join(",")).join(";")}`;
        if (cache[key]) {
          result[`leg${leg.id}`] = cache[key];
          continue;
        }
        try {
          const route = await fetchLegRoute(coords);
          cache[key] = route;
          result[`leg${leg.id}`] = route;
          if (!cancelled) setRoutes((r) => ({ ...r, [`leg${leg.id}`]: route }));
        } catch {
          failed++;
        }
      }

      if (!cancelled) {
        saveCache(cache);
        setRoutes((r) => ({ ...r, ...result }));
        setLoading(false);
        if (failed > 0) setError(`${failed} leg route(s) unavailable — showing straight lines for those.`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { routes, loading, error };
}
