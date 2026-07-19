import { useEffect } from "react";
import baked from "../data/venueDetails.json";
import { icons } from "../lib/icons";
import { poiLabel } from "./DetailModal";
import { projectLine } from "./PrintLeg";

function RouteSketch({ customRoute }) {
  const W = 680;
  const H = 340;
  const project = projectLine(customRoute.line, W, H);
  const path = customRoute.line
    .map((p, i) => `${i ? "L" : "M"}${project(p).map((n) => n.toFixed(1)).join(",")}`)
    .join(" ");
  return (
    <svg className="print-sketch" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
      <path d={path} fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {customRoute.stops.map((s, i) => {
        if (i === 0 || i === customRoute.stops.length - 1) return null;
        const [x, y] = project([s.lat, s.lng]);
        return (
          <g key={s.id}>
            <circle cx={x} cy={y} r="8" fill="#b45309" stroke="#fff" strokeWidth="2" />
            <text x={x} y={y + 3.5} fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Inter, sans-serif">
              {i}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function condense(text, max = 260) {
  if (!text) return null;
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export default function PrintMyRoute({ customRoute, postcodes, ratings, minRating, onDone }) {
  useEffect(() => {
    const after = () => onDone();
    window.addEventListener("afterprint", after);
    // give the stop photos a moment to load before the print dialog opens
    const t = setTimeout(() => window.print(), 1200);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", after);
    };
  }, [onDone]);

  const stops = customRoute.stops.slice(1, -1);
  const miles = (customRoute.distanceM / 1609.344).toFixed(0);
  const mins = Math.round(customRoute.durationS / 60);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="print-overlay">
      <div className="print-toolbar">
        <button onClick={() => window.print()}>Print / Save as PDF</button>
        <button onClick={onDone}>Close</button>
      </div>

      <div className="print-sheet">
        <header className="print-head">
          <div>
            <h1>My Top-Rated Route</h1>
            <p className="print-sub">
              Road Trip · Macclesfield loop · places rated {minRating}+ · {today}
            </p>
          </div>
          <div className="print-stats">
            <div><strong>{stops.length}</strong> stops</div>
            <div><strong>{miles} mi</strong> · {Math.floor(mins / 60)}h {mins % 60}m driving</div>
          </div>
        </header>

        <RouteSketch customRoute={customRoute} />

        <h2>Route order</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Stop</th>
              <th>Rating</th>
              <th>Sat nav postcode</th>
            </tr>
          </thead>
          <tbody>
            {stops.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>
                <td><strong>{s.name}</strong></td>
                <td>{ratings[s.id] ? `★ ${ratings[s.id]}/10` : s.type === "charger" ? "⚡ charger" : "—"}</td>
                <td className="print-postcode">
                  {postcodes[s.id]?.postcode || "—"}
                  {postcodes[s.id]?.approx ? " ≈" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="print-stops-heading">The stops</h2>
        {stops.map((s, i) => {
          const d = baked[s.id];
          const img = d?.wiki?.image;
          const iconKey = s.type === "optional" ? s.kind : s.type;
          return (
            <div className="print-stop" key={s.id}>
              {img ? (
                <img className="print-stop__photo" src={img} alt={s.name} />
              ) : (
                <div
                  className="print-stop__photo print-stop__photo--none"
                  dangerouslySetInnerHTML={{ __html: icons[iconKey] || icons.start }}
                />
              )}
              <div className="print-stop__body">
                <h3>
                  {i + 1}. {s.name}
                  <span className="print-stop__rating">
                    {ratings[s.id] ? ` ★ ${ratings[s.id]}/10` : s.type === "charger" ? " ⚡" : ""}
                  </span>
                </h3>
                <p className="print-stop__meta">
                  {poiLabel(s)}
                  {postcodes[s.id] ? ` · ${postcodes[s.id].postcode}` : ""}
                  {d?.address ? ` · ${d.address}` : ""}
                </p>
                <p className="print-stop__desc">{s.desc}</p>
                {d?.wiki?.extract && d.wiki.extract !== s.desc && (
                  <p className="print-stop__extract">{condense(d.wiki.extract)}</p>
                )}
                <p className="print-stop__links">
                  {s.website && <span>{s.website}</span>}
                  <span className="print-coords">
                    {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                  </span>
                </p>
              </div>
            </div>
          );
        })}

        <footer className="print-foot">
          Ratings are personal scores out of 10. ≈ marks a wide-area postcode match — verify
          remote locations before setting off. Photos and summaries from Wikipedia.
        </footer>
      </div>
    </div>
  );
}
