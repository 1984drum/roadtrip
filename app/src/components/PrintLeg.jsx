import { useEffect } from "react";
import { legRoutingCoords } from "../data/routeData";
import { optionalSitesForLeg } from "../data/optionalSites";
import { poiLabel } from "./DetailModal";

// Projects [lat,lng] points into a WIDTH x HEIGHT viewBox for the route sketch.
function projectLine(points, width, height, pad = 24) {
  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  // crude latitude correction so the sketch isn't squashed
  const latScale = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const spanX = (maxLng - minLng) * latScale || 0.001;
  const spanY = maxLat - minLat || 0.001;
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const ox = (width - spanX * scale) / 2;
  const oy = (height - spanY * scale) / 2;
  return ([lat, lng]) => [
    ox + (lng - minLng) * latScale * scale,
    height - oy - (lat - minLat) * scale,
  ];
}

function RouteSketch({ leg, route }) {
  const W = 680, H = 300;
  const line = route?.line || legRoutingCoords(leg);
  const project = projectLine(line, W, H);
  const path = line.map((p, i) => `${i ? "L" : "M"}${project(p).map((n) => n.toFixed(1)).join(",")}`).join(" ");
  return (
    <svg className="print-sketch" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
      <path d={path} fill="none" stroke="#0369a1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {leg.waypoints.map((wp) => {
        const [x, y] = project([wp.lat, wp.lng]);
        return (
          <g key={wp.id}>
            <circle cx={x} cy={y} r="6" fill={wp.type === "charger" ? "#0369a1" : "#b45309"} stroke="#fff" strokeWidth="2" />
            <text x={x + 10} y={y + 4} fontSize="12" fill="#1e293b" fontFamily="Inter, sans-serif">
              {wp.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PrintLeg({ leg, route, postcodes, onDone }) {
  useEffect(() => {
    const after = () => onDone();
    window.addEventListener("afterprint", after);
    const t = setTimeout(() => window.print(), 350);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", after);
    };
  }, [onDone]);

  const optional = optionalSitesForLeg(leg.id);
  const miles = route ? (route.distanceM / 1609.344).toFixed(0) : null;
  const mins = route ? Math.round(route.durationS / 60) : null;

  return (
    <div className="print-overlay">
      <div className="print-toolbar">
        <button onClick={() => window.print()}>Print / Save as PDF</button>
        <button onClick={onDone}>Close</button>
      </div>

      <div className="print-sheet">
        <header className="print-head">
          <div>
            <h1>{leg.title}</h1>
            <p className="print-sub">
              Road Trip · Macclesfield ⇄ Devon · {leg.direction} leg
            </p>
          </div>
          <div className="print-stats">
            <div><strong>{miles ? `${miles} mi` : leg.stats}</strong> distance</div>
            <div><strong>{mins ? `${Math.floor(mins / 60)}h ${mins % 60}m` : leg.estimatedTimeRange}</strong> driving</div>
          </div>
        </header>

        <p className="print-desc">{leg.desc}</p>

        <div className="print-info">
          <p><strong>Estimated duration (with stops):</strong> {leg.estimatedTimeRange}</p>
          <p><strong>Optimal travel:</strong> {leg.optimalTravelTime}</p>
        </div>

        <RouteSketch leg={leg} route={route} />

        <h2>Itinerary</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th>Stop</th>
              <th>Type</th>
              <th>Sat nav postcode</th>
              <th>Coordinates</th>
            </tr>
          </thead>
          <tbody>
            {leg.waypoints.map((wp) => (
              <tr key={wp.id}>
                <td>
                  <strong>{wp.name}</strong>
                  <br />
                  <span className="print-wp-desc">{wp.desc}</span>
                  {wp.website && (
                    <>
                      <br />
                      <span className="print-website">{wp.website}</span>
                    </>
                  )}
                </td>
                <td>{poiLabel(wp)}</td>
                <td className="print-postcode">
                  {postcodes[wp.id]?.postcode || "—"}
                  {postcodes[wp.id]?.approx ? " ≈" : ""}
                </td>
                <td className="print-coords">
                  {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {optional.length > 0 && (
          <>
            <h2>Optional detours nearby</h2>
            <table className="print-table print-table--optional">
              <tbody>
                {optional.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                      <br />
                      <span className="print-wp-desc">{s.desc}</span>
                      {s.website && (
                        <>
                          <br />
                          <span className="print-website">{s.website}</span>
                        </>
                      )}
                    </td>
                    <td>{poiLabel({ ...s, type: "optional" })}</td>
                    <td className="print-postcode">
                      {postcodes[s.id]?.postcode || "—"}
                      {postcodes[s.id]?.approx ? " ≈" : ""}
                    </td>
                    <td className="print-coords">
                      {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <footer className="print-foot">
          ≈ marks a wide-area postcode match — the nearest postcode may be some distance
          from the site itself. Verify remote locations before setting off.
        </footer>
      </div>
    </div>
  );
}
