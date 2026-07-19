import { typeLabels } from "../data/routeData";
import { icons } from "../lib/icons";
import { formatDistance } from "../hooks/useGeolocation";

function osrmSummary(route) {
  if (!route) return null;
  const miles = route.distanceM / 1609.344;
  const mins = Math.round(route.durationS / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${miles.toFixed(0)} mi · ${h ? `${h}h ` : ""}${m}m driving`;
}

function SpecBadge({ route, specMin, specMax }) {
  if (!route) return null;
  const mins = route.durationS / 60;
  if (mins > specMax + 15)
    return <span className="spec-badge spec-badge--over">{Math.round(mins - specMax)}m over spec</span>;
  if (mins > specMax)
    return <span className="spec-badge spec-badge--grace">+{Math.round(mins - specMax)}m grace</span>;
  if (mins < specMin) return <span className="spec-badge spec-badge--short">short hop</span>;
  return <span className="spec-badge spec-badge--ok">✓ in spec</span>;
}

export default function LegCard({
  leg,
  route,
  postcodes,
  ratings,
  specMin,
  specMax,
  selected,
  collapsed,
  onToggleCollapse,
  onSelect,
  onFocusWaypoint,
  onPrint,
}) {
  const isOutbound = leg.direction === "Outbound";
  return (
    <div
      className={`leg-card ${selected ? "leg-card--selected" : ""} ${collapsed ? "leg-card--collapsed" : ""}`}
      onClick={() => onSelect(leg.id)}
    >
      <div className="leg-card__head">
        <h3>{leg.title}</h3>
        <div className="leg-card__head-right">
          <span className={`leg-badge ${isOutbound ? "leg-badge--out" : "leg-badge--ret"}`}>
            {leg.direction}
          </span>
          <button
            className="leg-collapse-btn"
            aria-label={collapsed ? "Expand leg" : "Collapse leg"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(leg.id);
            }}
          >
            {collapsed ? "▸" : "▾"}
          </button>
        </div>
      </div>
      <div className="leg-card__stats-row">
        <p className="leg-card__stats">
          {osrmSummary(route) || leg.stats}
          <SpecBadge route={route} specMin={specMin} specMax={specMax} />
        </p>
        <button
          className="leg-print-btn"
          title="Printable A4 sheet for this leg (save as PDF to share)"
          onClick={(e) => {
            e.stopPropagation();
            onPrint(leg.id);
          }}
        >
          🖨 PDF
        </button>
      </div>

      {!collapsed && (
        <>
      <div className="leg-card__times">
        <div className="leg-time">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span><strong>Est. Duration:</strong> {leg.estimatedTimeRange}</span>
        </div>
        <div className="leg-time leg-time--info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span><strong>Optimal Travel:</strong> {leg.optimalTravelTime}</span>
        </div>
      </div>

      <p className="leg-card__desc">{leg.desc}</p>

      <div className="leg-card__waypoints">
        <h4>Key Waypoints</h4>
        <ul>
          {leg.waypoints.map((wp) => {
            const pc = postcodes[wp.id];
            return (
              <li
                key={wp.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onFocusWaypoint(wp);
                }}
              >
                <div
                  className={`wp-icon wp-icon--${wp.type}`}
                  dangerouslySetInnerHTML={{ __html: icons[wp.type] || icons.start }}
                />
                <div className="wp-text">
                  <p className="wp-name">{wp.name}</p>
                  <p className="wp-desc">{wp.desc}</p>
                  <p className="wp-meta">
                    <span className={`wp-type type-${wp.type}`}>{typeLabels[wp.type]}</span>
                    {ratings?.[wp.id] && <span className="wp-rating">★ {ratings[wp.id]}</span>}
                    {pc && (
                      <button
                        className="wp-postcode"
                        title="Copy postcode for sat nav"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard?.writeText(pc.postcode);
                          e.currentTarget.classList.add("copied");
                        }}
                      >
                        {pc.postcode}
                        {pc.approx ? " ≈" : ""}
                      </button>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
        </>
      )}
    </div>
  );
}

export { osrmSummary, formatDistance };
