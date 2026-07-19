import { useCallback, useState } from "react";

const KEY = "roadtrip.savedroutes.v1";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function persist(routes) {
  try {
    localStorage.setItem(KEY, JSON.stringify(routes));
  } catch {
    // storage unavailable
  }
}

/**
 * Named saved routes. Only stop ids + settings are stored (geometry is
 * re-fetched from OSRM on load, so entries stay tiny and sync-friendly).
 */
export function useSavedRoutes() {
  const [savedRoutes, setSavedRoutes] = useState(load);

  const saveRoute = useCallback((name, customRoute, settings) => {
    const entry = {
      id: `route-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim() || "Untitled route",
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      stopIds: customRoute.stops.slice(1, -1).map((s) => s.id),
      distanceM: customRoute.distanceM,
      durationS: customRoute.durationS,
      minRating: settings?.minRating ?? null,
      includeChargers: settings?.includeChargers ?? true,
    };
    setSavedRoutes((prev) => {
      const next = [entry, ...prev];
      persist(next);
      return next;
    });
    return entry;
  }, []);

  const deleteRoute = useCallback((id) => {
    setSavedRoutes((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { savedRoutes, saveRoute, deleteRoute };
}
