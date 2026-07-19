// Road routing with a motorway preference:
//   yes       -> OSRM demo server (fastest routes, motorways welcome)
//   sometimes -> Valhalla (FOSSGIS) with use_highways 0.5 — motorways only
//                when they genuinely earn their keep
//   no        -> Valhalla with use_highways 0.05 — A-roads and lanes
// Valhalla failures fall back to OSRM so the app always gets a route.

export const MOTORWAY_MODES = [
  { key: "yes", label: "Yes" },
  { key: "sometimes", label: "Sometimes" },
  { key: "no", label: "No" },
];

export const MOTORWAY_KEY = "roadtrip.motorways.v1";

export function getMotorwayMode() {
  const v = localStorage.getItem(MOTORWAY_KEY);
  return v === "no" || v === "sometimes" ? v : "yes";
}

export function setMotorwayMode(mode) {
  localStorage.setItem(MOTORWAY_KEY, mode);
}

async function osrmRoute(coords) {
  const pairs = coords.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${pairs}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const json = await res.json();
  if (json.code !== "Ok" || !json.routes?.length) throw new Error("No route");
  const route = json.routes[0];
  return {
    line: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceM: route.distance,
    durationS: route.duration,
  };
}

// Valhalla encodes shapes as polylines with 6 decimal places
function decodePolyline6(str) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < str.length) {
    for (const which of [0, 1]) {
      let shift = 0;
      let result = 0;
      let byte;
      do {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += delta;
      else lng += delta;
    }
    points.push([lat / 1e6, lng / 1e6]);
  }
  return points;
}

async function valhallaRoute(coords, useHighways) {
  const res = await fetch("https://valhalla1.openstreetmap.de/route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      locations: coords.map(([lat, lng]) => ({ lat, lon: lng })),
      costing: "auto",
      costing_options: { auto: { use_highways: useHighways } },
    }),
  });
  if (!res.ok) throw new Error(`Valhalla ${res.status}`);
  const json = await res.json();
  const trip = json.trip;
  if (!trip?.legs?.length) throw new Error("No route");
  const line = trip.legs.flatMap((leg) => decodePolyline6(leg.shape));
  return {
    line,
    distanceM: trip.summary.length * 1000, // km -> m
    durationS: trip.summary.time,
  };
}

/** Route through [lat,lng] coords honouring the motorway preference. */
export async function fetchDrivingRoute(coords, mode = "yes") {
  if (mode === "yes") return osrmRoute(coords);
  try {
    return await valhallaRoute(coords, mode === "no" ? 0.05 : 0.5);
  } catch {
    return osrmRoute(coords); // Valhalla down — a motorway route beats none
  }
}
