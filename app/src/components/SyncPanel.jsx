import { useRef, useState } from "react";
import { buildSyncUrl, downloadBackup, importBackupFile } from "../lib/syncData";

export default function SyncPanel() {
  const [status, setStatus] = useState(null);
  const fileRef = useRef(null);

  const copyLink = async () => {
    const url = buildSyncUrl();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Road Trip data", url });
        setStatus("Shared ✓");
      } else {
        await navigator.clipboard.writeText(url);
        setStatus("Link copied ✓ — open it on the other device");
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
      <p className="assistant__blurb">
        Your ratings and saved routes live in this browser and survive app updates. To move them
        to another device (or keep a backup), use a sync link or a file.
      </p>
      <div className="syncpanel__row">
        <button className="offline__btn" onClick={copyLink}>
          {navigator.share ? "Share sync link" : "Copy sync link"}
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
