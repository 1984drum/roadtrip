import { useCallback, useEffect, useMemo, useState } from "react";
import MapView, { BASE_LAYERS } from "./components/MapView";
import PrintMyRoute from "./components/PrintMyRoute";
import PrintTrip from "./components/PrintTrip";
import LegCard from "./components/LegCard";
import DetailModal from "./components/DetailModal";
import PrintLeg from "./components/PrintLeg";
import OfflinePanel from "./components/OfflinePanel";
import AssistantPanel from "./components/AssistantPanel";
import SyncPanel from "./components/SyncPanel";
import { routeData, allWaypoints, getWaypoint } from "./data/routeData";
import { useSavedRoutes } from "./hooks/useSavedRoutes";
import { parseSyncFragment, applyImport } from "./lib/syncData";
import {
  cloudAvailable,
  getSyncCode,
  setSyncCode,
  newSyncCode,
  disableSync,
  pullAndMerge,
  pushCloud,
  parsePairFragment,
} from "./lib/cloudSync";
import { useRoutes } from "./hooks/useRoutes";
import { usePostcodes } from "./hooks/usePostcodes";
import { useRatings } from "./hooks/useRatings";
import { useGeolocation, distanceM, formatDistance } from "./hooks/useGeolocation";
import {
  buildStopList,
  fetchCustomRoute,
  allPois,
  pointsAlongLine,
  makeSketchStops,
} from "./lib/customRoute";
import { computeTripStats } from "./lib/tripStats";
import { MOTORWAY_MODES, getMotorwayMode, setMotorwayMode } from "./lib/router";

const poiById = new Map(allPois.map((p) => [p.id, p]));
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
  const [showExtras, setShowExtras] = useState(false);
  const [detailWp, setDetailWp] = useState(null);
  const [printLegId, setPrintLegId] = useState(null);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  // legs start collapsed for a zoomed-out overview of the whole trip
  const [collapsedLegs, setCollapsedLegs] = useState(() => new Set(routeData.map((l) => l.id)));
  const [loadOpen, setLoadOpen] = useState(false);
  const [myRouteOpen, setMyRouteOpen] = useState(false);
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState(null); // 'downloading' | 'ready' | null
  const [printMyRoute, setPrintMyRoute] = useState(false);
  const [printTrip, setPrintTrip] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [tripName, setTripName] = useState("Road Trip");
  const [editingName, setEditingName] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const { savedRoutes, saveRoute, deleteRoute } = useSavedRoutes();
  const [syncCode, setSyncCodeState] = useState(getSyncCode);
  const [pulled, setPulled] = useState(false);
  const [sketchMode, setSketchMode] = useState(false);
  const [sketchPoints, setSketchPoints] = useState(null);
  const [motorways, setMotorways] = useState(getMotorwayMode);
  // drive-time spec (minutes per leg) — the planner's design rule
  const [specMin, setSpecMin] = useState(() => Number(localStorage.getItem("roadtrip.specmin.v1")) || 45);
  const [specMax, setSpecMax] = useState(() => Number(localStorage.getItem("roadtrip.specmax.v1")) || 120);

  const switchMotorways = (mode) => {
    setMotorways(mode);
    setMotorwayMode(mode);
  };
  const [baseLayer, setBaseLayer] = useState(
    () => localStorage.getItem("roadtrip.baselayer.v1") || "colour"
  );

  const switchLayer = (key) => {
    setBaseLayer(key);
    localStorage.setItem("roadtrip.baselayer.v1", key);
  };
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

  const { routes, loading: routesLoading, error: routesError } = useRoutes(motorways);
  const postcodes = usePostcodes();
  const { ratings, setRating } = useRatings();
  const gps = useGeolocation();

  const ratedCount = Object.keys(ratings).length;
  const qualifyingCount = useMemo(
    () => Object.values(ratings).filter((r) => r >= minRating).length,
    [ratings, minRating]
  );

  // Load a list of stop ids (from a saved route or the AI assistant) onto the map
  const applyStopIds = async (stopIds, name) => {
    const stops = [
      getWaypoint("macc-start"),
      ...stopIds.map((id) => poiById.get(id)).filter(Boolean),
      getWaypoint("macc-end"),
    ];
    if (stops.length < 3) {
      setRouteError("That route has no recognisable stops.");
      return;
    }
    setRouteBuilding(true);
    setRouteError(null);
    try {
      setCustomRoute(await fetchCustomRoute(stops, motorways));
      if (name) setTripName(name);
      setDirty(false); // loaded trips are already saved
      setMyRouteOpen(true);
    } catch {
      setRouteError("Couldn't fetch the route from OSRM — try again in a moment.");
    } finally {
      setRouteBuilding(false);
    }
  };

  // Import ratings/routes arriving via a #sync= link from another device
  useEffect(() => {
    const payload = parseSyncFragment(location.hash);
    if (!payload) return;
    history.replaceState(null, "", location.pathname + location.search);
    const summary = `${Object.keys(payload.ratings || {}).length} ratings and ${(payload.savedRoutes || []).length} saved routes`;
    if (window.confirm(`Import ${summary} from this sync link? They merge with anything already here.`)) {
      applyImport(payload);
      location.reload();
    }
  }, []);

  // Pair this device for auto-sync via a #pair= link
  useEffect(() => {
    const code = parsePairFragment(location.hash);
    if (!code || !cloudAvailable()) return;
    history.replaceState(null, "", location.pathname + location.search);
    if (window.confirm("Link this device for auto-sync with your other devices?")) {
      setSyncCode(code);
      location.reload();
    }
  }, []);

  // Auto-sync: pull + merge on open, then debounced push on every change
  useEffect(() => {
    if (!cloudAvailable() || !syncCode) return;
    pullAndMerge(syncCode)
      .then((changed) => {
        if (changed) location.reload();
        else setPulled(true);
      })
      .catch(() => setPulled(true)); // offline — keep local, push when back
  }, [syncCode]);

  useEffect(() => {
    if (!cloudAvailable() || !syncCode || !pulled) return;
    const t = setTimeout(() => pushCloud(syncCode).catch(() => {}), 2000);
    return () => clearTimeout(t);
  }, [ratings, savedRoutes, syncCode, pulled]);

  const enableSync = () => {
    if (
      !window.confirm(
        "Turn on auto-sync? Your ratings and saved routes will back up to a private cloud store, and the first sync may take a minute (including data used offline). Continue?"
      )
    )
      return;
    const code = newSyncCode();
    setSyncCodeState(code);
    setPulled(true);
    pushCloud(code).catch(() => {});
  };

  const disableSyncHere = () => {
    disableSync();
    setSyncCodeState(null);
    setPulled(false);
  };

  // Sketch mode: handles at 0/20/40/60/80/100% of the visible route
  const routesReady = routeData.every((l) => routes[`leg${l.id}`]);

  // Whole-trip stats: the summary strip numbers plus the fun ones
  const tripStats = useMemo(
    () => (routesReady ? computeTripStats(routes) : null),
    [routesReady, routes]
  );

  const commitName = (value) => {
    setTripName(value.trim() || "Road Trip");
    setEditingName(false);
    if (customRoute) setDirty(true);
  };

  const saveTrip = () => {
    if (!customRoute) return;
    saveRoute(tripName, customRoute, { minRating, includeChargers });
    setDirty(false);
  };
  const startSketch = () => {
    if (!routesReady) return;
    if (customRoute) {
      const ok = window.confirm(
        "Create a new trip? The route currently on the map will be discarded.\n\nIf you want to keep it, choose Cancel and save it first (★ My Route → Save)."
      );
      if (!ok) return;
      setCustomRoute(null);
    }
    const line = routeData.flatMap((l) => routes[`leg${l.id}`].line);
    setSketchPoints(pointsAlongLine(line, [0, 0.2, 0.4, 0.6, 0.8, 1]));
    setSketchMode(true);
    setSheetOpen(false);
    setLoadOpen(false);
  };

  const cancelSketch = () => {
    setSketchMode(false);
    setSketchPoints(null);
  };

  const buildFromSketch = async () => {
    if (!sketchPoints) return;
    setRouteBuilding(true);
    setRouteError(null);
    try {
      setCustomRoute(await fetchCustomRoute(makeSketchStops(sketchPoints), motorways));
      if (tripName === "Road Trip") setTripName("Sketched trip");
      setDirty(true);
      setSketchMode(false);
      setSketchPoints(null);
      setMyRouteOpen(true);
    } catch {
      setRouteError("Couldn't route the sketch via OSRM — try again in a moment.");
    } finally {
      setRouteBuilding(false);
    }
  };

  const applyPoints = async (points, name) => {
    setRouteBuilding(true);
    setRouteError(null);
    try {
      setCustomRoute(await fetchCustomRoute(makeSketchStops(points), motorways));
      if (name) setTripName(name);
      setDirty(false);
      setMyRouteOpen(true);
    } catch {
      setRouteError("Couldn't fetch the route from OSRM — try again in a moment.");
    } finally {
      setRouteBuilding(false);
    }
  };

  const buildMyRoute = async () => {
    setRouteError(null);
    const stops = buildStopList(ratings, minRating, includeChargers);
    if (!stops) {
      setRouteError(`No places rated ${minRating}+ yet — rate some stops first (tap a marker).`);
      return;
    }
    setRouteBuilding(true);
    try {
      setCustomRoute(await fetchCustomRoute(stops, motorways));
      if (tripName === "Road Trip") setTripName("Top-rated trip");
      setDirty(true);
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
            <div className="trip-title">
              {editingName ? (
                <input
                  className="trip-title__input"
                  autoFocus
                  defaultValue={tripName}
                  maxLength={40}
                  onBlur={(e) => commitName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitName(e.target.value);
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
              ) : (
                <>
                  <h1>{tripName}</h1>
                  <button
                    className="trip-rename"
                    title="Rename this trip"
                    aria-label="Rename this trip"
                    onClick={() => setEditingName(true)}
                  >
                    ✎
                  </button>
                </>
              )}
              {dirty && <span className="unsaved-tag">unsaved</span>}
              <button
                className="trip-save"
                onClick={saveTrip}
                disabled={!customRoute}
                title={
                  customRoute
                    ? "Save this trip to your saved trips"
                    : "Build or sketch a custom trip to save it — the classic loop is always here"
                }
              >
                SAVE
              </button>
            </div>
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
              Ancient Salt Roads and medieval trade corridors in 12 legs — every one verified
              at ~2 hours' driving or less (the longest, into Exmoor, sits at 2h15).
              Superchargers, YHA overnights, castles, abbeys and stone circles built into
              the flow.
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
                  onClick={() => {
                    setFilter(f.key);
                    if (f.key === "pub") setShowExtras(true); // pubs are optional stops
                  }}
                >
                  {f.label}
                </button>
              ))}
              <button
                className={`filter-btn filter-btn--extras ${showExtras ? "filter-btn--active" : ""}`}
                onClick={() => setShowExtras((v) => !v)}
                title="Optional historic sites, viewpoints and pubs near the route"
              >
                Optional Stops
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
                  <button
                    className="myroute__clear"
                    onClick={() => {
                      setCustomRoute(null);
                      setTripName("Road Trip");
                      setDirty(false);
                    }}
                  >
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
                  <button className="myroute__print" onClick={() => setPrintMyRoute(true)}>
                    🖨 Print route — A4 sheets with photos
                  </button>
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
                  <p className="myroute__savehint">
                    Rename and <strong>SAVE</strong> this trip from the panel header above.
                  </p>
                </div>
              )}

              {savedRoutes.length > 0 && (
                <div className="savedlist">
                  <h4 className="savedlist__head">Saved routes</h4>
                  {savedRoutes.map((r) => (
                    <div key={r.id} className="savedlist__row">
                      <button
                        className="savedlist__load"
                        onClick={() => (r.points ? applyPoints(r.points, r.name) : applyStopIds(r.stopIds, r.name))}
                      >
                        <span className="savedlist__name">{r.name}</span>
                        <span className="savedlist__meta">
                          {r.points ? `sketched · ${r.points.length} points` : `${r.stopIds.length} stops`} ·{" "}
                          {(r.distanceM / 1609.344).toFixed(0)} mi · {r.date}
                        </span>
                      </button>
                      <button
                        className="savedlist__del"
                        title="Delete saved route"
                        onClick={() => {
                          if (window.confirm(`Delete "${r.name}"?`)) deleteRoute(r.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className="section-toggle" onClick={() => setOfflineOpen((v) => !v)}>
            <span>
              Offline maps
              {offlineStatus === "downloading" && " (downloading…)"}
              {offlineStatus === "ready" && " ✓"}
            </span>
            <span className="section-chevron">{offlineOpen ? "▾" : "▸"}</span>
          </button>
          {/* stays mounted so auto-download runs with the section collapsed */}
          <div style={{ display: offlineOpen ? "block" : "none" }}>
            <OfflinePanel routes={routes} baseLayer={baseLayer} onStatus={setOfflineStatus} />
          </div>

          {/* AI route assistant on hold — sketch mode replaces it for now.
              Re-enable by restoring this block (AssistantPanel + worker /ai are still live). */}
          {false && (
            <AssistantPanel
              ratings={ratings}
              customRoute={customRoute}
              onApplyRoute={applyStopIds}
              syncCode={syncCode}
            />
          )}

          <button className="section-toggle" onClick={() => setSyncOpen((v) => !v)}>
            <span>Backup & sync</span>
            <span className="section-chevron">{syncOpen ? "▾" : "▸"}</span>
          </button>
          {syncOpen && (
            <SyncPanel syncCode={syncCode} onEnable={enableSync} onDisable={disableSyncHere} />
          )}

          {/* Planner spec — always visible so the drive-time rule stays front of mind */}
          <div className="planner">
            <label className="planner__item" title="Legs shorter than this get flagged as short hops">
              Min drive
              <select
                className="planner__select"
                value={specMin}
                onChange={(e) => {
                  setSpecMin(Number(e.target.value));
                  localStorage.setItem("roadtrip.specmin.v1", e.target.value);
                }}
              >
                {[30, 45, 60, 75, 90].map((m) => (
                  <option key={m} value={m}>{m}m</option>
                ))}
              </select>
            </label>
            <label className="planner__item" title="Legs beyond this (+15m grace) get flagged as over spec">
              Max drive
              <select
                className="planner__select"
                value={specMax}
                onChange={(e) => {
                  setSpecMax(Number(e.target.value));
                  localStorage.setItem("roadtrip.specmax.v1", e.target.value);
                }}
              >
                {[90, 105, 120, 135, 150, 180].map((m) => (
                  <option key={m} value={m}>{m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${m}m`}</option>
                ))}
              </select>
            </label>
            <div className="planner__item planner__item--motorways" title="Yes = fastest roads. Sometimes = motorways only when they earn their keep. No = A-roads and lanes (slower, prettier).">
              Motorways
              <div className="planner__seg">
                {MOTORWAY_MODES.map((m) => (
                  <button
                    key={m.key}
                    className={`planner__seg-btn ${motorways === m.key ? "planner__seg-btn--on" : ""}`}
                    onClick={() => switchMotorways(m.key)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {routesLoading && <p className="route-status">Fetching real road routes…</p>}
          {routesError && <p className="route-status route-status--warn">{routesError}</p>}
        </header>

        {tripStats && (
          <>
            <button
              className="trip-summary"
              onClick={() => setStatsOpen((o) => !o)}
              title={`Minimum assumes up to ~5½ hours driving a day and skipping most stops. Recommended is one leg per day with proper time at the stops and the YHA overnights, plus a day or two to linger. Click for more stats.`}
            >
              <span>
                🚗 {tripStats.miles.toFixed(0)} mi · {Math.floor(tripStats.driveH)}h{" "}
                {Math.round((tripStats.driveH % 1) * 60)}m driving
              </span>
              <span className="trip-summary__days">
                minimum <strong>{tripStats.minDays} days</strong> · recommended{" "}
                <strong>{tripStats.recMin}–{tripStats.recMax} days</strong>{" "}
                <span className="trip-summary__chevron">{statsOpen ? "▾" : "▸"}</span>
              </span>
            </button>
            {statsOpen && (
              <div className="trip-stats">
                <div className="trip-stats__row">
                  ⚡ ~{Math.round(tripStats.kwh)} kWh across {tripStats.chargers} Supercharger
                  stops · about {Math.round(tripStats.miles / tripStats.driveH)} mph average
                </div>
                <div className="trip-stats__row">
                  🌱 ~{Math.round(tripStats.co2kg)} kg of tailpipe CO₂ a petrol car would have
                  emitted
                </div>
                <div className="trip-stats__row">
                  🏰 {tripStats.castles} castles · ⛪ {tripStats.abbeys} abbeys ·{" "}
                  {tripStats.cathedrals} cathedrals · 🗿 {tripStats.prehistoric} prehistoric
                  monuments
                </div>
                <div className="trip-stats__row">
                  🍺 {tripStats.pubs} historic pubs · 🛏 {tripStats.stays} YHA nights · 🏞{" "}
                  {tripStats.nature} wild landscapes · {tripStats.totalStops} possible stops in
                  all
                </div>
                <div className="trip-stats__row">
                  🕰 Combined age of every datable site:{" "}
                  <strong>{tripStats.totalYears.toLocaleString()} years</strong>
                </div>
                <div className="trip-stats__row">
                  👴 Oldest stop: {tripStats.oldestName} — humans here for ~
                  {tripStats.oldestAge.toLocaleString()} years
                </div>
                <div className="trip-stats__row">
                  🗺 {tripStats.counties} counties &amp; council areas crossed
                </div>
                <button className="trip-stats__print" onClick={() => setPrintTrip(true)}>
                  🖨 Print whole trip — condensed A4 (4 pages)
                </button>
              </div>
            )}
          </>
        )}

        <div className="legs-scroll">
          {routeData.map((leg) => (
            <LegCard
              key={leg.id}
              leg={leg}
              route={routes[`leg${leg.id}`]}
              postcodes={postcodes}
              ratings={ratings}
              specMin={specMin}
              specMax={specMax}
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
          postcodes={postcodes}
          customRoute={customRoute}
          baseLayer={baseLayer}
          sketchMode={sketchMode}
          sketchPoints={sketchPoints}
          onSketchChange={setSketchPoints}
          userPosition={gps.tracking ? gps.position : null}
          follow={follow}
          focusRequest={focusRequest}
          onOpenDetail={openDetail}
        />

        {/* Base layer switcher */}
        <div className="layer-switcher">
          {Object.entries(BASE_LAYERS).map(([key, def]) => (
            <button
              key={key}
              className={`layer-btn ${baseLayer === key ? "layer-btn--on" : ""}`}
              onClick={() => switchLayer(key)}
            >
              {def.label}
            </button>
          ))}
        </div>

        {/* Trip actions: create / load / print */}
        {!sketchMode && (
          <div className="trip-fabs">
            <button
              className="sketch-fab"
              onClick={startSketch}
              disabled={!routesReady}
              title="Start a fresh trip: drag six handles into a rough loop, then build it into a real route"
            >
              ＋ Create new trip
            </button>
            <button className="load-fab" onClick={() => setLoadOpen((o) => !o)}>
              📂 Load trip
            </button>
            {customRoute && (
              <button className="print-route-fab" onClick={() => setPrintMyRoute(true)}>
                🖨 Print route
              </button>
            )}
            {loadOpen && (
              <div className="load-popover">
                {savedRoutes.length === 0 && (
                  <p className="load-popover__empty">
                    No saved trips yet — build or sketch a route, then Save it in ★ My Route.
                  </p>
                )}
                {savedRoutes.map((r) => (
                  <button
                    key={r.id}
                    className="load-popover__item"
                    onClick={() => {
                      setLoadOpen(false);
                      if (r.points) applyPoints(r.points, r.name);
                      else applyStopIds(r.stopIds, r.name);
                    }}
                  >
                    <span className="load-popover__name">{r.name}</span>
                    <span className="load-popover__meta">
                      {(r.distanceM / 1609.344).toFixed(0)} mi · {r.date}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {sketchMode && (
          <div className="sketch-bar">
            <span className="sketch-bar__hint">New trip: drag the six handles into a rough loop</span>
            <button className="sketch-bar__build" onClick={buildFromSketch} disabled={routeBuilding}>
              {routeBuilding ? "Routing…" : "Build route"}
            </button>
            <button className="sketch-bar__cancel" onClick={cancelSketch}>Cancel</button>
          </div>
        )}

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

      {printTrip && (
        <PrintTrip
          routes={routes}
          postcodes={postcodes}
          tripStats={tripStats}
          onDone={() => setPrintTrip(false)}
        />
      )}

      {printMyRoute && customRoute && (
        <PrintMyRoute
          customRoute={customRoute}
          postcodes={postcodes}
          ratings={ratings}
          minRating={minRating}
          onDone={() => setPrintMyRoute(false)}
        />
      )}
    </div>
  );
}
