import { useRef, useState } from "react";
import { buildSyncUrl, downloadBackup, importBackupFile } from "../lib/syncData";
import { cloudAvailable, buildPairUrl } from "../lib/cloudSync";

export default function SyncPanel({ syncCode, onEnable, onDisable }) {
  const [status, setStatus] = useState(null);
  const fileRef = useRef(null);

  const shareUrl = async (url, doneMsg) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Road Trip", url });
        setStatus("Shared ✓");
      } else {
        await navigator.clipboard.writeText(url);
        setStatus(doneMsg);
      }
    } catch {
      // share sheet dismissed
    }
  };

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const summary = await importBackupFile(file);
      setStatus(`Imported ${summary.ratings} ratings, ${summary.routes} routes — reloading…`);
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      setStatus(`⚠ ${err.message}`);
    }
    e.target.value = "";
  };

  return (
    <div className="syncpanel">
      {cloudAvailable() ? (
        syncCode ? (
          <div className="syncpanel__cloud">
            <p className="syncpanel__on">
              ✓ Auto-sync is on — ratings and saved routes back up to the cloud a couple of
              seconds after every change, and other paired devices pick them up when opened.
            </p>
            <div className="syncpanel__row">
              <button
                className="offline__btn"
                onClick={() => shareUrl(buildPairUrl(syncCode), "Pair link copied ✓ — open it on the other device")}
              >
                {navigator.share ? "Share pair link" : "Copy pair link"}
              </button>
              <button
                className="offline__btn offline__btn--secondary"
                onClick={() => {
                  if (window.confirm("Turn off auto-sync on this device? Cloud data stays until overwritten.")) onDisable();
                }}
              >
                Turn off
              </button>
            </div>
          </div>
        ) : (
          <div className="syncpanel__cloud">
            <p className="assistant__blurb">
              Auto-sync keeps ratings and saved routes identical across your devices via a tiny
              private cloud store — no account, just a secret link between your devices. It also
              unlocks the AI assistant without needing an API key.
            </p>
            <button className="offline__btn" onClick={onEnable}>
              Enable auto-sync
            </button>
          </div>
        )
      ) : (
        <p className="assistant__blurb">
          Your ratings and saved routes live in this browser and survive app updates. Use these
          to move them to another device or keep a backup.
        </p>
      )}

      <div className="syncpanel__row syncpanel__row--backup">
        <button
          className="offline__btn offline__btn--secondary"
          onClick={() => shareUrl(buildSyncUrl(), "Data link copied ✓ — open it on the other device")}
        >
          Copy data link
        </button>
        <button className="offline__btn offline__btn--secondary" onClick={downloadBackup}>
          Export file
        </button>
        <button className="offline__btn offline__btn--secondary" onClick={() => fileRef.current?.click()}>
          Import file
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImportFile} />
      </div>
      {status && <p className="syncpanel__status">{status}</p>}
    </div>
  );
}
