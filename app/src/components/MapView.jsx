import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { routeData, legRoutingCoords } from "../data/routeData";
import { optionalSites } from "../data/optionalSites";
import { icons } from "../lib/icons";

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
  const onOpenDetailRef = useRef(onOpenDetail);
  onOpenDetailRef.current = onOpenDetail;

  // Init once
  useEffect(() => {
    const map = L.map(mapEl.current, { zoomControl: false }).setView([52.2, -2.5], 7);
    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    const allPoints = routeData.flatMap((leg) => legRoutingCoords(leg));
    map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40] });

    mapRef.current = map;
    return () => map.remove();
  }, []);

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
        opacity: selectedLegId && !isSelected ? 0.35 : 0.85,
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
  }, [routes, selectedLegId]);

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
      marker.bindTooltip(wp.name, { direction: "top", offset: [0, -14], opacity: 0.9 });
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
  }, [filter, showExtras]);

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
