import { useEffect, useMemo, useRef, useState } from "react";
import { routeData } from "../data/routeData";
import {
  computeTileList,
  downloadTiles,
  clearTiles,
  estimateBytes,
  META_KEY,
} from "../lib/offlineTiles";

const AUTO_KEY = "roadtrip.offline.auto";

const fmtMB = (b) => `${Math.max(1, Math.round(b / 1048576))} MB`;

/** Looks metered? Best-effort — the Network Information API is patchy. */
function looksMetered() {
  const c = navigator.connection;
  return !!c && (c.saveData || c.type === "cellular");
}

export default function OfflinePanel({ routes, onStatus }) {
  const [meta, setMeta] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(META_KEY));
    } catch {
      return null;
    }
  });
  const [auto, setAuto] = useState(() => localStorage.getItem(AUTO_KEY) !== "0");
  const [progress, setProgress] = useState(null);
  const [swReady, setSwReady] = useState(false);
  const abortRef = useRef(null);
  const startedRef = useRef(false);

  const routesReady = routeData.every((l) => routes[`leg${l.id}`]);
  const tiles = useMemo(() => (routesReady ? computeTileList(routes) : null), [routesReady, routes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (navigator.serviceWorker.controller) setSwReady(true);
    else navigator.serviceWorker.ready.then(() => setSwReady(true)).catch(() => {});
  }, []);

  useEffect(() => {
    onStatus?.(progress ? "downloading" : meta ? "ready" : null);
  }, [progress, meta, onStatus]);

  const start = async () => {
    if (!tiles || abortRef.current) return;
    startedRef.current = true;
    try {
      await navigator.storage?.persist?.();
    } catch {
      // persistence denied — caches still work, just evictable
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setProgress({ done: 0, total: tiles.length, bytes: 0, failed: 0 });
    const result = await downloadTiles(tiles, setProgress, ctrl.signal);
    if (!ctrl.signal.aborted) {
      const m = {
        tiles: result.done - result.failed,
        bytes: result.bytes,
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      };
      localStorage.setItem(META_KEY, JSON.stringify(m));
      setMeta(m);
    }
    abortRef.current = null;
    setProgress(null);
  };

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setProgress(null);
  };

  const clear = async () => {
    await clearTiles();
    setMeta(null);
  };

  // Auto-download once per device when the connection doesn't look metered.
  useEffect(() => {
    if (!auto || meta || !routesReady || startedRef.current) return;
    if (navigator.onLine === false || looksMetered()) return;
    start();
  }, [auto, meta, routesReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAuto = (on) => {
    setAuto(on);
    localStorage.setItem(AUTO_KEY, on ? "1" : "0");
  };

  return (
    <div className="offline">
      <p className="offline__status">
        {swReady
          ? "✓ App shell cached — the app itself opens without signal."
          : import.meta.env.DEV
            ? "Service worker runs in the deployed build (not in dev)."
            : "Preparing offline support…"}
      </p>

      {meta && !progress && (
        <p className="offline__meta">
          ✓ Offline maps ready — {meta.tiles.toLocaleString()} tiles ({fmtMB(meta.bytes)}), saved{" "}
          {meta.date}.
        </p>
      )}

      {progress && (
        <div className="offline__progress">
          <div className="offline__bar">
            <div
              className="offline__bar-fill"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
          <p className="offline__progress-text">
            Downloading map tiles… {progress.done.toLocaleString()} / {progress.total.toLocaleString()}
            {progress.failed > 0 ? ` (${progress.failed} failed)` : ""}
          </p>
        </div>
      )}

      <div className="offline__actions">
        {!progress && (
          <button className="offline__btn" onClick={start} disabled={!tiles}>
            {meta ? "Re-download maps" : tiles ? `Download maps (~${fmtMB(estimateBytes(tiles.length))})` : "Waiting for routes…"}
          </button>
        )}
        {progress && (
          <button className="offline__btn offline__btn--secondary" onClick={cancel}>
            Pause
          </button>
        )}
        {meta && !progress && (
          <button className="offline__btn offline__btn--secondary" onClick={clear}>
            Clear
          </button>
        )}
      </div>

      <label className="myroute__label myroute__label--check offline__auto">
        <input type="checkbox" checked={auto} onChange={(e) => toggleAuto(e.target.checked)} />
        Auto-download when not on a metered connection
      </label>
      <p className="offline__note">
        Covers the whole route corridor (zoom 7–13) plus close-up detail at every stop. Wikipedia
        photos and fonts cache as you browse; route lines, postcodes and place info are stored in
        the app. Keep the tab open while downloading — resuming later re-uses everything already
        saved.
      </p>
    </div>
  );
}
