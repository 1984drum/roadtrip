import { useCallback, useMemo, useState } from "react";
import MapView from "./components/MapView";
import LegCard from "./components/LegCard";
import DetailModal from "./components/DetailModal";
import PrintLeg from "./components/PrintLeg";
import { routeData, allWaypoints } from "./data/routeData";
import { useRoutes } from "./hooks/useRoutes";
import { usePostcodes } from "./hooks/usePostcodes";
import { useRatings } from "./hooks/useRatings";
import { useGeolocation, distanceM, formatDistance } from "./hooks/useGeolocation";
import { buildStopList, fetchCustomRoute } from "./lib/customRoute";
import "./App.css";

const FILTERS = [
  { key: "all", label: "All Stops" },
  { key: "history", label: "Historical" },
  { key: "nature", label: "Nature" },
  { key: "charger", label: "Superchargers" },
  { key: "stay", label: "Lodging" },
  { key: "pub", label: "Pubs" },
];

export default function App() {
  const [filter, setFilter] = useState("all");
  const [selectedLegId, setSelectedLegId] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [follow, setFollow] = useState(true);
  const [showExtras, setShowExtras] = useState(true);
  const [detailWp, setDetailWp] = useState(null);
  const [printLegId, setPrintLegId] = useState(null);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [collapsedLegs, setCollapsedLegs] = useState(() => new Set());
  const [myRouteOpen, setMyRouteOpen] = useState(false);
  const [minRating, setMinRating] = useState(7);
  const [includeChargers, setIncludeChargers] = useState(true);
  const [customRoute, setCustomRoute] = useState(null);
  const [routeBuilding, setRouteBuilding] = useState(false);
  const [routeError, setRouteError] = useState(null);

  const toggleLegCollapse = (id) =>
    setCollapsedLegs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const { routes, loading: routesLoading, error: routesError } = useRoutes();
  const postcodes = usePostcodes();
  const { ratings, setRating } = useRatings();
  const gps = useGeolocation();

  const ratedCount = Object.keys(ratings).length;
  const qualifyingCount = useMemo(
    () => Object.values(ratings).filter((r) => r >= minRating).length,
    [ratings, minRating]
  );

  const buildMyRoute = async () => {
    setRouteError(null);
    const stops = buildStopList(ratings, minRating, includeChargers);
    if (!stops) {
      setRouteError(`No places rated ${minRating}+ yet — rate some stops first (tap a marker).`);
      return;
    }
    setRouteBuilding(true);
    try {
      setCustomRoute(await fetchCustomRoute(stops));
    } catch {
      setRouteError("Couldn't fetch the route from OSRM — try again in a moment.");
    } finally {
      setRouteBuilding(false);
    }
  };

  const nearest = useMemo(() => {
    if (!gps.position) return null;
    let bestWp = null;
    let bestCharger = null;
    for (const wp of allWaypoints) {
      const d = distanceM(gps.position, wp);
      if (!bestWp || d < bestWp.d) bestWp = { wp, d };
      if (wp.type === "charger" && (!bestCharger || d < bestCharger.d)) bestCharger = { wp, d };
    }
    return { bestWp, bestCharger };
  }, [gps.position]);

  const focusWaypoint = (wp) => {
    setFocusRequest({ lat: wp.lat, lng: wp.lng, wpId: wp.id, ts: Date.now() });
    setSheetOpen(false); // collapse sheet on mobile so the map is visible
    setDetailWp(wp);
  };

  const openDetail = useCallback((wp) => setDetailWp(wp), []);
  const closePrint = useCallback(() => setPrintLegId(null), []);
  const printLeg = printLegId ? routeData.find((l) => l.id === printLegId) : null;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sheetOpen ? "sidebar--open" : ""} ${sidebarHidden ? "sidebar--hidden" : ""}`}>
        <button
          className="sheet-handle"
          aria-label={sidebarHidden ? "Show route panel" : sheetOpen ? "Collapse route panel" : "Expand route panel"}
          onClick={() => (sidebarHidden ? setSidebarHidden(false) : setSheetOpen((o) => !o))}
        >
          <span />
        </button>

        <header className="sidebar__header">
          <div className="header-top">
            <h1>Road Trip</h1>
            <button
              className="hide-sidebar-btn"
              title="Hide panel — full-screen map"
              aria-label="Hide panel"
              onClick={() => setSidebarHidden(true)}
            >
              «
            </button>
          </div>

          <button className="section-toggle" onClick={() => setAboutOpen((v) => !v)}>
            <span>Macclesfield to Devon Route</span>
            <span className="section-chevron">{aboutOpen ? "▾" : "▸"}</span>
          </button>
          {aboutOpen && (
            <p className="sidebar__blurb">
              Ancient Salt Roads and medieval trade corridors in 1.5–2 hour driving blocks,
              avoiding motorways where the landscape deserves better. Superchargers and YHA
              stops built into every leg.
            </p>
          )}

          <button className="section-toggle" onClick={() => setFiltersOpen((v) => !v)}>
            <span>Filters</span>
            <span className="section-chevron">{filtersOpen ? "▾" : "▸"}</span>
          </button>
          {filtersOpen && (
            <div className="filter-row">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`filter-btn filter-btn--${f.key} ${filter === f.key ? "filter-btn--active" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
              <button
                className={`filter-btn filter-btn--extras ${showExtras ? "filter-btn--active" : ""}`}
                onClick={() => setShowExtras((v) => !v)}
                title="Optional historic sites, viewpoints and pubs near the route"
              >
                Extras {showExtras ? "on" : "off"}
              </button>
            </div>
          )}
          <button className="section-toggle" onClick={() => setMyRouteOpen((v) => !v)}>
            <span>★ My Route{customRoute ? " (active)" : ""}</span>
            <span className="section-chevron">{myRouteOpen ? "▾" : "▸"}</span>
          </button>
          {myRouteOpen && (
            <div className="myroute">
              <p className="myroute__blurb">
                Rate places out of 10 (tap any marker), then build a personalised loop from
                Macclesfield through your favourites. {ratedCount} rated so far.
              </p>
              <div className="myroute__controls">
                <label className="myroute__label">
                  Include places rated
                  <select
                    className="myroute__select"
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n}+
                      </option>
                    ))}
                  </select>
                  <span className="myroute__count">({qualifyingCount} qualify)</span>
                </label>
                <label className="myroute__label myroute__label--check">
                  <input
                    type="checkbox"
                    checked={includeChargers}
                    onChange={(e) => setIncludeChargers(e.target.checked)}
                  />
                  Always include Superchargers
                </label>
              </div>
              <div className="myroute__actions">
                <button className="myroute__build" onClick={buildMyRoute} disabled={routeBuilding}>
                  {routeBuilding ? "Routing…" : customRoute ? "Rebuild route" : "Build my route"}
                </button>
                {customRoute && (
                  <button className="myroute__clear" onClick={() => setCustomRoute(null)}>
                    Clear
                  </button>
                )}
              </div>
              {routeError && <p className="route-status route-status--warn">{routeError}</p>}
              {customRoute && (
                <div className="myroute__result">
                  <p className="myroute__stats">
                    {customRoute.stops.length - 2} stops ·{" "}
                    {(customRoute.distanceM / 1609.344).toFixed(0)} mi ·{" "}
                    {Math.floor(customRoute.durationS / 3600)}h{" "}
                    {Math.round((customRoute.durationS % 3600) / 60)}m driving
                  </p>
                  <ol className="myroute__list">
                    {customRoute.stops.slice(1, -1).map((s) => (
                      <li key={s.id} onClick={() => focusWaypoint(s)}>
                        <span className="myroute__stop-name">{s.name}</span>
                        <span className="myroute__stop-meta">
                          {ratings[s.id] ? `★${ratings[s.id]}` : s.type === "charger" ? "⚡" : ""}
                          {postcodes[s.id] ? ` · ${postcodes[s.id].postcode}` : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {routesLoading && <p className="route-status">Fetching real road routes…</p>}
          {routesError && <p className="route-status route-status--warn">{routesError}</p>}
        </header>

        <div className="legs-scroll">
          {routeData.map((leg) => (
            <LegCard
              key={leg.id}
              leg={leg}
              route={routes[`leg${leg.id}`]}
              postcodes={postcodes}
              ratings={ratings}
              selected={selectedLegId === leg.id}
              collapsed={collapsedLegs.has(leg.id)}
              onToggleCollapse={toggleLegCollapse}
              onSelect={(id) => {
                setSelectedLegId(id === selectedLegId ? null : id);
                setSheetOpen(false);
              }}
              onFocusWaypoint={focusWaypoint}
              onPrint={setPrintLegId}
            />
          ))}
        </div>
      </aside>

      <main className="map-pane">
        <MapView
          filter={filter}
          showExtras={showExtras}
          selectedLegId={selectedLegId}
          routes={routes}
          ratings={ratings}
          customRoute={customRoute}
          userPosition={gps.tracking ? gps.position : null}
          follow={follow}
          focusRequest={focusRequest}
          onOpenDetail={openDetail}
        />

        {/* GPS controls */}
        <div className="gps-controls">
          {sidebarHidden && (
            <button
              className="gps-btn reopen-btn"
              onClick={() => setSidebarHidden(false)}
              title="Show route panel"
            >
              » Road Trip
            </button>
          )}
          <button
            className={`gps-btn ${gps.tracking ? "gps-btn--on" : ""}`}
            onClick={() => gps.setTracking(!gps.tracking)}
            title={gps.tracking ? "Stop GPS tracking" : "Start GPS tracking"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
              <circle cx="12" cy="12" r="8" />
            </svg>
            {gps.tracking ? "Tracking" : "Track me"}
          </button>
          {gps.tracking && (
            <button
              className={`gps-btn gps-btn--small ${follow ? "gps-btn--on" : ""}`}
              onClick={() => setFollow(!follow)}
              title="Keep the map centred on your position"
            >
              {follow ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Live GPS status strip */}
        {gps.tracking && (
          <div className="gps-status">
            {gps.error && <span className="gps-status__err">{gps.error}</span>}
            {!gps.error && !gps.position && <span>Acquiring GPS fix…</span>}
            {gps.position && nearest && (
              <>
                <span>
                  <strong>{nearest.bestWp.wp.name}</strong> {formatDistance(nearest.bestWp.d)}
                </span>
                <span className="gps-status__charger">
                  ⚡ {nearest.bestCharger.wp.name} {formatDistance(nearest.bestCharger.d)}
                </span>
                {gps.position.speed != null && gps.position.speed > 0.5 && (
                  <span>{Math.round(gps.position.speed * 2.23694)} mph</span>
                )}
              </>
            )}
          </div>
        )}
        {!gps.tracking && gps.error && <div className="gps-status gps-status--err">{gps.error}</div>}

        {/* Legend (desktop only) */}
        <div className="legend">
          <h3>Legend</h3>
          <div><i className="dot dot--start" /> Start/End</div>
          <div><i className="dot dot--history" /> Medieval Masonry</div>
          <div><i className="dot dot--nature" /> Rugged Landscape</div>
          <div><i className="dot dot--stay" /> Historic Lodging (YHA)</div>
          <div><i className="dot dot--charger" /> Tesla Supercharger</div>
          <div><i className="dot dot--optional" /> Optional Sites & Pubs</div>
          {customRoute && <div><i className="dot dot--myroute" /> My Top-Rated Route</div>}
        </div>
      </main>

      {detailWp && (
        <DetailModal
          wp={detailWp}
          postcode={postcodes[detailWp.id]}
          rating={ratings[detailWp.id] || 0}
          onRate={setRating}
          onClose={() => setDetailWp(null)}
        />
      )}

      {printLeg && (
        <PrintLeg
          leg={printLeg}
          route={routes[`leg${printLeg.id}`]}
          postcodes={postcodes}
          onDone={closePrint}
        />
      )}
    </div>
  );
}
