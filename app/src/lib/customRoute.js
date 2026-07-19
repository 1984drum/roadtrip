// Builds a personalised route through the user's top-rated places:
// nearest-neighbour ordering from Macclesfield + 2-opt improvement,
// then real road geometry from OSRM.
import { routeData, getWaypoint } from "../data/routeData";
import { optionalSites } from "../data/optionalSites";
import { distanceM } from "../hooks/useGeolocation";
import { fetchDrivingRoute } from "./router";

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

/** Evenly-spaced points along a polyline at the given fractions (0..1). */
export function pointsAlongLine(line, fractions) {
  const cum = [0];
  for (let i = 1; i < line.length; i++) {
    cum.push(
      cum[i - 1] +
        distanceM(
          { lat: line[i - 1][0], lng: line[i - 1][1] },
          { lat: line[i][0], lng: line[i][1] }
        )
    );
  }
  const total = cum[cum.length - 1];
  return fractions.map((f) => {
    const target = f * total;
    if (target <= 0) return [...line[0]];
    if (target >= total) return [...line[line.length - 1]];
    let i = 1;
    while (cum[i] < target) i++;
    const t = (target - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [
      line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t,
      line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t,
    ];
  });
}

/** Pseudo-waypoints for a sketched route (arbitrary map points, not POIs). */
export function makeSketchStops(points) {
  return points.map((p, i) => ({
    id: `sketch-${i}`,
    name:
      i === 0
        ? "Start (sketched)"
        : i === points.length - 1
          ? "Finish (sketched)"
          : `Via ${i} (sketched)`,
    lat: p[0],
    lng: p[1],
    type: "sketch",
  }));
}

export async function fetchCustomRoute(stops, motorwayMode = "yes") {
  const route = await fetchDrivingRoute(
    stops.map((s) => [s.lat, s.lng]),
    motorwayMode
  );
  return { stops, ...route };
}
