import { useCallback, useState } from "react";

const KEY = "roadtrip.ratings.v1";

/**
 * The user's personal 1-10 rating for each place, persisted on the device.
 * setRating(id, null) clears a rating.
 */
export function useRatings() {
  const [ratings, setRatings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  });

  const setRating = useCallback((id, value) => {
    setRatings((prev) => {
      const next = { ...prev };
      if (value == null) delete next[id];
      else next[id] = value;
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // storage unavailable — ratings just won't survive a reload
      }
      return next;
    });
  }, []);

  return { ratings, setRating };
}
