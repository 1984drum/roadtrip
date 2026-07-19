// Builds a personalised route through the user's top-rated places:
// nearest-neighbour ordering from Macclesfield + 2-opt improvement,
// then real road geometry from OSRM.
import { routeData, getWaypoint } from "../data/routeData";
import { optionalSites } from "../data/optionalSites";
import { distanceM } from "../hooks/useGeolocation";

export const allPois = [
  ...routeData.flatMap((l) => l.waypoints),
  ...optionalSites.map((s) => ({ ...s, type: "optional" })),
];

/**
 * Picks every place rated >= minRating (plus Superchargers if requested),
 * and orders them into a loop from/to Macclesfield.
 * Returns the ordered stop list including start and end, or null if
 * nothing qualifies.
 */
export function buildStopList(ratings, minRating, includeChargers) {
  const start = getWaypoint("macc-start");
  const picked = allPois.filter((p) => {
    if (p.id === "macc-start" || p.id === "macc-end") return false;
    if (includeChargers && p.type === "charger") return true;
    return (ratings[p.id] || 0) >= minRating;
  });
  if (!picked.some((p) => p.type !== "charger")) return null;

  // nearest neighbour from the start
  const remaining = [...picked];
  const order = [];
  let cur = start;
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((p, i) => {
      const d = distanceM(cur, p);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    cur = remaining.splice(bestIdx, 1)[0];
    order.push(cur);
  }

  // 2-opt improvement on the closed loop (endpoints fixed at Macclesfield)
  const pts = [start, ...order, getWaypoint("macc-end")];
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < pts.length - 2; i++) {
      for (let k = i + 1; k < pts.length - 1; k++) {
        const delta =
          distanceM(pts[i - 1], pts[k]) +
          distanceM(pts[i], pts[k + 1]) -
          distanceM(pts[i - 1], pts[i]) -
          distanceM(pts[k], pts[k + 1]);
        if (delta < -50) {
          const reversed = pts.slice(i, k + 1).reverse();
          pts.splice(i, k - i + 1, ...reversed);
          improved = true;
        }
      }
    }
  }
  return pts;
}

export async function fetchCustomRoute(stops) {
  const pairs = stops.map((s) => `${s.lng},${s.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${pairs}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const json = await res.json();
  if (json.code !== "Ok" || !json.routes?.length) throw new Error("No route found");
  const route = json.routes[0];
  return {
    stops,
    line: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceM: route.distance,
    durationS: route.duration,
  };
}
