import { useEffect, useRef, useState } from "react";

/**
 * Live GPS tracking via watchPosition. Tracking is off until the user
 * enables it (browsers require a user gesture context for the permission
 * prompt to feel sane on mobile anyway).
 */
export function useGeolocation() {
  const [tracking, setTracking] = useState(false);
  const [position, setPosition] = useState(null); // {lat, lng, accuracy, heading, speed, timestamp}
  const [error, setError] = useState(null);
  const watchId = useRef(null);

  useEffect(() => {
    if (!tracking) {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported on this device.");
      setTracking(false);
      return;
    }
    setError(null);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — enable it in your browser settings."
            : "Couldn't get a GPS fix."
        );
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [tracking]);

  return { tracking, setTracking, position, error };
}

/** Haversine distance in metres. */
export function distanceM(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatDistance(m) {
  const miles = m / 1609.344;
  if (miles < 0.2) return `${Math.round(m)} m`;
  return `${miles.toFixed(miles < 10 ? 1 : 0)} mi`;
}
