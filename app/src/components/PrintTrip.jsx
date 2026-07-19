import { useEffect } from "react";
import { routeData, getWaypoint } from "../data/routeData";
import { optionalSites } from "../data/optionalSites";
import { projectLine } from "./PrintLeg";

// Condensed whole-trip sheet: 4 A4 portrait pages max.
// P1 overview + route sketch · P2-3 the 12 legs at a glance · P4 sat-nav crib sheet.

function TripSketch({ routes }) {
  const W = 680;
  const H = 420;
  const line = routeData.flatMap((l) => routes[`leg${l.id}`]?.line || []);
  if (!line.length) return null;
  const project = projectLine(line, W, H);
  const path = line
    .map((p, i) => `${i ? "L" : "M"}${project(p).map((n) => n.toFixed(1)).join(",")}`)
    .join(" ");
  return (
    <svg className="print-sketch print-sketch--trip" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
      <path d={path} fill="none" stroke="#0369a1" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {routeData.map((leg) => {
        const first = getWaypoint(leg.stopOrder[0]);
        const [x, y] = project([first.lat, first.lng]);
        return (
          <g key={leg.id}>
            <circle cx={x} cy={y} r="9" fill="#0369a1" stroke="#fff" strokeWidth="2" />
            <text x={x} y={y + 3.5} fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Inter, sans-serif">
              {leg.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function fmtHM(durationS) {
  const mins = Math.round(durationS / 60);
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
}

export default function PrintTrip({ routes, postcodes, tripStats, onDone }) {
  useEffect(() => {
    const after = () => onDone();
    window.addEventListener("afterprint", after);
    const t = setTimeout(() => window.print(), 600);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", after);
    };
  }, [onDone]);

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const allStops = routeData.flatMap((leg) => leg.stopOrder.map((id) => getWaypoint(id)));

  return (
    <div className="print-overlay">
      <div className="print-toolbar">
        <button onClick={() => window.print()}>Print / Save as PDF</button>
        <button onClick={onDone}>Close</button>
      </div>

      <div className="print-sheet print-sheet--trip">
        {/* ---- Page 1: overview ---- */}
        <header className="print-head">
          <div>
            <h1>Road Trip — the whole loop</h1>
            <p className="print-sub">Macclesfield ⇄ Devon · 12 legs · {today}</p>
          </div>
          {tripStats && (
            <div className="print-stats">
              <div><strong>{tripStats.miles.toFixed(0)} mi</strong> · {Math.floor(tripStats.driveH)}h {Math.round((tripStats.driveH % 1) * 60)}m driving</div>
              <div>min <strong>{tripStats.minDays}</strong> · recommended <strong>{tripStats.recMin}–{tripStats.recMax} days</strong></div>
            </div>
          )}
        </header>

        {tripStats && (
          <p className="print-tripline">
            ⚡ ~{Math.round(tripStats.kwh)} kWh · {tripStats.chargers} Superchargers · 🏰 {tripStats.castles} castles ·
            ⛪ {tripStats.abbeys} abbeys · {tripStats.cathedrals} cathedrals · 🗿 {tripStats.prehistoric} prehistoric ·
            🛏 {tripStats.stays} YHA nights · 🕰 {tripStats.totalYears.toLocaleString()} combined years of history ·
            🗺 {tripStats.counties} counties
          </p>
        )}

        <TripSketch routes={routes} />
        <p className="print-foot">Numbered dots mark where each leg begins. Full per-leg sheets (with photos) print from each leg card in the app.</p>

        {/* ---- Pages 2-3: legs at a glance ---- */}
        <h2 className="print-legs-heading">The legs at a glance</h2>
        {routeData.map((leg) => {
          const r = routes[`leg${leg.id}`];
          return (
            <div className="print-legrow" key={leg.id}>
              <div className="print-legrow__head">
                <span className="print-legrow__title">{leg.title}</span>
                <span className="print-legrow__meta">
                  {leg.direction} · {r ? `${(r.distanceM / 1609.344).toFixed(0)} mi · ${fmtHM(r.durationS)}` : leg.stats}
                </span>
              </div>
              <p className="print-legrow__desc">{leg.desc}</p>
              <p className="print-legrow__stops">
                {leg.stopOrder.map((id, i) => {
                  const wp = getWaypoint(id);
                  const pc = postcodes[id]?.postcode;
                  return (
                    <span key={id}>
                      {i > 0 && " → "}
                      <strong>{wp.name}</strong>
                      {pc ? ` (${pc})` : ""}
                    </span>
                  );
                })}
              </p>
              <p className="print-legrow__tip">{leg.optimalTravelTime}</p>
            </div>
          );
        })}

        {/* ---- Page 4: sat-nav crib sheet ---- */}
        <h2 className="print-crib-heading">Sat-nav crib sheet</h2>
        <div className="print-crib">
          {allStops.map((wp, i) => (
            <div className="print-crib__row" key={wp.id}>
              <span className="print-crib__n">{i + 1}</span>
              <span className="print-crib__name">{wp.name}</span>
              <span className="print-postcode">
                {postcodes[wp.id]?.postcode || "—"}
                {postcodes[wp.id]?.approx ? " ≈" : ""}
              </span>
            </div>
          ))}
        </div>

        <h3 className="print-crib-sub">Optional stops nearby (grey markers in the app)</h3>
        <div className="print-crib print-crib--optional">
          {optionalSites.map((s) => (
            <div className="print-crib__row" key={s.id}>
              <span className="print-crib__n">L{s.nearLeg}</span>
              <span className="print-crib__name">{s.name}</span>
              <span className="print-postcode">
                {postcodes[s.id]?.postcode || "—"}
                {postcodes[s.id]?.approx ? " ≈" : ""}
              </span>
            </div>
          ))}
        </div>

        <footer className="print-foot">
          ≈ marks a wide-area postcode match — verify remote locations before setting off. Times
          are live-routed driving only; add time for the stops themselves.
        </footer>
      </div>
    </div>
  );
}
