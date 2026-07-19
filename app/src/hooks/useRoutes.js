import { useEffect, useState } from "react";
import { routeData, legRoutingCoords } from "../data/routeData";
import { fetchDrivingRoute } from "../lib/router";

const CACHE_KEY = "roadtrip.routes.v3"; // bumped: 15-leg structure + motorway modes

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

/**
 * Fetches real road geometry for every leg (honouring the motorway
 * preference), cached in localStorage per mode.
 * Returns { routes: {legId: {line, distanceM, durationS}}, loading, error }.
 */
export function useRoutes(motorwayMode) {
  const [routes, setRoutes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setRoutes({});
    setLoading(true);
    setError(null);
    (async () => {
      const cache = loadCache();
      const result = {};
      let failed = 0;

      for (const leg of routeData) {
        if (cancelled) return;
        const coords = legRoutingCoords(leg);
        const key = `${motorwayMode}:leg${leg.id}:${coords.map((c) => c.join(",")).join(";")}`;
        if (cache[key]) {
          result[`leg${leg.id}`] = cache[key];
          setRoutes((r) => ({ ...r, [`leg${leg.id}`]: cache[key] }));
          continue;
        }
        try {
          const route = await fetchDrivingRoute(coords, motorwayMode);
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
  }, [motorwayMode]);

  return { routes, loading, error };
}
