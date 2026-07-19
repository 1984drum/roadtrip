import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { routeData, legRoutingCoords } from "../data/routeData";
import { optionalSites } from "../data/optionalSites";
import { icons } from "../lib/icons";

export const BASE_LAYERS = {
  colour: {
    label: "Map",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    maxZoom: 19,
    attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
  },
  terrain: {
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    maxZoom: 17,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
  },
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

// Roughly England + Wales with a little sea margin — no pointless zooming out
const UK_BOUNDS = [
  [49.5, -7.5],
  [56.2, 2.2],
];

function createCustomIcon(type, kind) {
  const isOptional = type === "optional";
  const size = type === "start" ? 28 : isOptional ? 26 : 32;
  const iconKey = isOptional ? kind : type;
  return L.divIcon({
    className: `custom-marker marker-${isOptional ? "optional" : type}`,
    html: icons[iconKey] || icons.start,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function legLinePopupHtml(leg, osrm) {
  const miles = osrm ? `${(osrm.distanceM / 1609.344).toFixed(0)} mi` : leg.stats;
  const mins = osrm ? Math.round(osrm.durationS / 60) : null;
  const drive = mins ? `${Math.floor(mins / 60)}h ${mins % 60}m non-stop driving` : leg.estimatedTimeRange;
  return `
    <div class="popup-body">
      <h4>${leg.title}</h4>
      <div class="line-popup__stats">
        <span class="line-popup__stat">📏 ${miles}</span>
        <span class="line-popup__stat">🕒 ${drive}</span>
      </div>
      <p>${leg.direction} · with stops allow ${leg.estimatedTimeRange}</p>
    </div>`;
}

export default function MapView({
  filter,
  showExtras,
  selectedLegId,
  routes,
  ratings,
  customRoute,
  baseLayer,
  sketchMode,
  sketchPoints,
  onSketchChange,
  userPosition,
  follow,
  focusRequest, // {lat, lng, wpId, ts} — imperative "fly here" signal from the sidebar
  onOpenDetail,
}) {
  const mapRef = useRef(null);
  const mapEl = useRef(null);
  const markersRef = useRef([]);
  const linesRef = useRef([]);
  const userLayerRef = useRef(null);
  const customLayerRef = useRef(null);
  const baseLayerRef = useRef(null);
  const sketchLayerRef = useRef(null);
  const onOpenDetailRef = useRef(onOpenDetail);
  onOpenDetailRef.current = onOpenDetail;
  const onSketchChangeRef = useRef(onSketchChange);
  onSketchChangeRef.current = onSketchChange;

  // Init once
  useEffect(() => {
    const map = L.map(mapEl.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 6, // no zooming out past England
      maxZoom: 19,
      maxBounds: UK_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomSnap: 0.5, // finer zoom steps
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 120,
    }).setView([52.2, -2.5], 7);
    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

    const allPoints = routeData.flatMap((leg) => legRoutingCoords(leg));
    map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40] });

    mapRef.current = map;
    return () => map.remove();
  }, []);

  // Base layer switching
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const def = BASE_LAYERS[baseLayer] || BASE_LAYERS.colour;
    if (baseLayerRef.current) map.removeLayer(baseLayerRef.current);
    baseLayerRef.current = L.tileLayer(def.url, {
      attribution: def.attribution,
      subdomains: def.subdomains || "abc",
      maxZoom: 19,
      maxNativeZoom: def.maxZoom,
    }).addTo(map);
    mapEl.current.classList.toggle("map-root--light", baseLayer !== "dark" && baseLayer !== "satellite");
  }, [baseLayer]);

  // Route lines: real OSRM geometry when available, straight fallback otherwise.
  // Tapping a line shows that leg's distance and driving time.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    linesRef.current.forEach((l) => map.removeLayer(l));
    linesRef.current = [];

    routeData.forEach((leg) => {
      const osrm = routes[`leg${leg.id}`];
      const latlngs = osrm ? osrm.line : legRoutingCoords(leg);
      const isSelected = selectedLegId === leg.id;

      // invisible fat line underneath for a comfortable tap target
      const hitLine = L.polyline(latlngs, { color: "#000", opacity: 0, weight: 22 }).addTo(map);
      const line = L.polyline(latlngs, {
        color: leg.direction === "Outbound" ? "#0ea5e9" : "#38bdf8",
        weight: isSelected ? 6 : 4,
        opacity: customRoute ? 0.2 : selectedLegId && !isSelected ? 0.35 : 0.85,
        dashArray: osrm ? null : "6 8", // dashed = fallback straight line
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
        className: osrm ? "road-route" : "fallback-route",
      }).addTo(map);

      hitLine.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        L.popup({ maxWidth: 240 })
          .setLatLng(e.latlng)
          .setContent(legLinePopupHtml(leg, osrm))
          .openOn(map);
      });

      linesRef.current.push(hitLine, line);
    });
  }, [routes, selectedLegId, customRoute]);

  // Personalised top-rated route: gold line + numbered stop badges
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (customLayerRef.current) {
      map.removeLayer(customLayerRef.current);
      customLayerRef.current = null;
    }
    if (!customRoute) return;

    const group = L.layerGroup();
    L.polyline(customRoute.line, {
      color: "#f59e0b",
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(group);
    customRoute.stops.forEach((s, i) => {
      if (i === 0 || i === customRoute.stops.length - 1) return; // Macclesfield endpoints
      L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          className: "custom-route-num",
          html: `${i}`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
        interactive: false,
        zIndexOffset: 600,
      }).addTo(group);
    });
    group.addTo(map);
    customLayerRef.current = group;
    map.flyToBounds(L.latLngBounds(customRoute.line), { padding: [50, 50], duration: 1.2 });
  }, [customRoute]);

  // Markers: main waypoints + optional grey sites. Tap opens the detail modal.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const addMarker = (wp) => {
      const marker = L.marker([wp.lat, wp.lng], {
        icon: createCustomIcon(wp.type, wp.kind),
        zIndexOffset: wp.type === "optional" ? -100 : 0,
      });
      const rating = ratings?.[wp.id];
      marker.bindTooltip(rating ? `${wp.name} · ★${rating}` : wp.name, {
        direction: "top",
        offset: [0, -14],
        opacity: 0.9,
      });
      marker.on("click", () => onOpenDetailRef.current(wp));
      marker.wpId = wp.id;
      marker.addTo(map);
      markersRef.current.push(marker);
    };

    routeData.forEach((leg) => {
      leg.waypoints.forEach((wp) => {
        if (filter !== "all" && wp.type !== filter && wp.type !== "start") return;
        addMarker(wp);
      });
    });

    if (showExtras) {
      optionalSites.forEach((s) => {
        const wp = { ...s, type: "optional" };
        if (filter !== "all" && filter !== s.kind) return;
        addMarker(wp);
      });
    }
  }, [filter, showExtras, ratings]);

  // Fly to selected leg
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLegId) return;
    const leg = routeData.find((l) => l.id === selectedLegId);
    const osrm = routes[`leg${leg.id}`];
    const pts = osrm ? osrm.line : legRoutingCoords(leg);
    map.flyToBounds(L.latLngBounds(pts), { padding: [50, 50], duration: 1.2 });
  }, [selectedLegId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to a waypoint when the sidebar asks
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusRequest) return;
    map.flyTo([focusRequest.lat, focusRequest.lng], 14, { duration: 1.2 });
  }, [focusRequest]);

  // Sketch mode: six draggable handles + dashed sketch line.
  // The layer is created once per sketch session ([sketchMode] deps only) —
  // drags mutate Leaflet state directly and report positions upward without
  // tearing the layer down mid-gesture.
  const sketchPointsRef = useRef(sketchPoints);
  sketchPointsRef.current = sketchPoints;
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (sketchLayerRef.current) {
      map.removeLayer(sketchLayerRef.current);
      sketchLayerRef.current = null;
    }
    const points = sketchPointsRef.current;
    if (!sketchMode || !points?.length) return;

    const group = L.layerGroup();
    const line = L.polyline(points, {
      color: "#f472b6",
      weight: 3,
      dashArray: "8 8",
      opacity: 0.9,
      interactive: false,
    }).addTo(group);

    const markers = points.map((pt, i) => {
      const isEnd = i === 0 || i === points.length - 1;
      const label = i === 0 ? "S" : i === points.length - 1 ? "E" : `${i * 20}%`;
      const marker = L.marker(pt, {
        draggable: true,
        zIndexOffset: 1500,
        icon: L.divIcon({
          className: `sketch-handle ${isEnd ? "sketch-handle--end" : ""}`,
          html: label,
          iconSize: isEnd ? [26, 26] : [38, 22],
          iconAnchor: isEnd ? [13, 13] : [19, 11],
        }),
      });
      const report = () => {
        line.setLatLngs(markers.map((m) => m.getLatLng()));
        // defer the React update out of Leaflet's drag-finish call chain
        setTimeout(() => {
          onSketchChangeRef.current(markers.map((m) => [m.getLatLng().lat, m.getLatLng().lng]));
        }, 0);
      };
      marker.on("drag", () => line.setLatLngs(markers.map((m) => m.getLatLng())));
      marker.on("dragend", report);
      marker.addTo(group);
      return marker;
    });

    group.addTo(map);
    sketchLayerRef.current = group;
  }, [sketchMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // User GPS marker + accuracy circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userLayerRef.current) {
      map.removeLayer(userLayerRef.current);
      userLayerRef.current = null;
    }
    if (!userPosition) return;

    const group = L.layerGroup();
    L.circle([userPosition.lat, userPosition.lng], {
      radius: userPosition.accuracy || 30,
      color: "#38bdf8",
      weight: 1,
      opacity: 0.4,
      fillOpacity: 0.1,
    }).addTo(group);
    L.marker([userPosition.lat, userPosition.lng], {
      icon: L.divIcon({
        className: "user-marker",
        html: '<div class="user-dot"><div class="user-pulse"></div></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      zIndexOffset: 1000,
    }).addTo(group);
    group.addTo(map);
    userLayerRef.current = group;

    if (follow) {
      map.setView([userPosition.lat, userPosition.lng], Math.max(map.getZoom(), 13), {
        animate: true,
      });
    }
  }, [userPosition, follow]);

  return <div ref={mapEl} className="map-root" />;
}
