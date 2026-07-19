// Whole-trip statistics — the useful and the gloriously pointless.
import { routeData } from "../data/routeData";
import { allPois } from "./customRoute";
import baked from "../data/venueDetails.json";

const YEAR = new Date().getFullYear();

export function computeTripStats(routes) {
  if (!routeData.every((l) => routes[`leg${l.id}`])) return null;

  const miles =
    routeData.reduce((s, l) => s + routes[`leg${l.id}`].distanceM, 0) / 1609.344;
  const driveH =
    routeData.reduce((s, l) => s + routes[`leg${l.id}`].durationS, 0) / 3600;

  const dated = allPois.filter((p) => typeof p.built === "number");
  const totalYears = dated.reduce((s, p) => s + (YEAR - p.built), 0);
  const oldest = dated.reduce((a, b) => (a.built < b.built ? a : b));

  const counties = new Set();
  for (const p of allPois) {
    const addr = baked[p.id]?.address;
    if (!addr) continue;
    const parts = addr.split(", ");
    let county = parts[parts.length - 1];
    if (/\d/.test(county)) county = parts[parts.length - 2]; // drop postcode
    if (county && !/\d/.test(county)) counties.add(county);
  }

  return {
    miles,
    driveH,
    avgMph: miles / driveH,
    minDays: Math.max(2, Math.ceil(driveH / 5.5)),
    recMin: routeData.length,
    recMax: routeData.length + 2,
    kwh: miles * 0.27, // typical Model 3/Y consumption
    co2kg: miles * 0.25, // tailpipe CO2 a petrol car would emit
    castles: allPois.filter((p) => p.name.includes("Castle")).length,
    abbeys: allPois.filter((p) => p.name.includes("Abbey")).length,
    cathedrals: allPois.filter((p) => p.name.includes("Cathedral")).length,
    prehistoric: dated.filter((p) => p.built < 0).length,
    pubs: allPois.filter((p) => p.kind === "pub").length,
    chargers: allPois.filter((p) => p.type === "charger").length,
    stays: allPois.filter((p) => p.type === "stay").length,
    nature: allPois.filter((p) => p.type === "nature" || p.kind === "nature").length,
    totalStops: allPois.length,
    totalYears,
    oldestName: oldest.name,
    oldestAge: YEAR - oldest.built,
    counties: counties.size,
  };
}
