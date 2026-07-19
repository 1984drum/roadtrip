import { useState } from "react";
import { typeLabels } from "../data/routeData";
import { icons } from "../lib/icons";
import { useVenueDetails } from "../hooks/useVenueDetails";

export function poiLabel(wp) {
  if (wp.type === "optional") {
    if (wp.kind === "pub") return "Historic Pub";
    if (wp.kind === "nature") return "Optional · Landscape";
    return "Optional · Antiquity";
  }
  return typeLabels[wp.type] || "Waypoint";
}

export default function DetailModal({ wp, postcode, onClose }) {
  const { details, loading } = useVenueDetails(wp);
  const [shareState, setShareState] = useState(null);

  if (!wp) return null;

  const iconKey = wp.type === "optional" ? wp.kind : wp.type;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${wp.lat},${wp.lng}`;
  const reviewsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${wp.name} ${postcode?.postcode || ""}`
  )}`;

  const shareText = [
    `${wp.name} — ${poiLabel(wp)}`,
    details?.wiki?.extract || wp.desc,
    details?.address ? `Address: ${details.address}` : null,
    postcode ? `Postcode (sat nav): ${postcode.postcode}` : null,
    wp.website ? `Official site: ${wp.website}` : null,
    `Map: ${mapsUrl}`,
    details?.wiki?.url ? `More: ${details.wiki.url}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: wp.name, text: shareText });
        setShareState("shared");
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareState("copied");
      }
    } catch {
      // user cancelled the share sheet — not an error
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={wp.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal__close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {details?.wiki?.image ? (
          <div className="modal__hero">
            <img src={details.wiki.image} alt={wp.name} loading="lazy" />
          </div>
        ) : (
          <div className={`modal__hero modal__hero--placeholder hero--${iconKey}`}>
            <span dangerouslySetInnerHTML={{ __html: icons[iconKey] || icons.start }} />
          </div>
        )}

        <div className="modal__body">
          <div className="modal__title-row">
            <h3>{wp.name}</h3>
            <span className={`modal__badge badge--${iconKey} ${wp.type === "optional" ? "badge--optional" : ""}`}>
              {poiLabel(wp)}
            </span>
          </div>

          <p className="modal__desc">{wp.desc}</p>

          {loading && <p className="modal__loading">Fetching details from Wikipedia &amp; OpenStreetMap…</p>}

          {details?.wiki?.extract && details.wiki.extract !== wp.desc && (
            <p className="modal__extract">
              {details.wiki.extract}
              {details.wiki.url && (
                <>
                  {" "}
                  <a href={details.wiki.url} target="_blank" rel="noopener noreferrer">
                    Wikipedia ↗
                  </a>
                </>
              )}
            </p>
          )}

          <dl className="modal__facts">
            {details?.address && (
              <>
                <dt>Address</dt>
                <dd>{details.address}</dd>
              </>
            )}
            <dt>Sat nav postcode</dt>
            <dd>
              {postcode ? (
                <button
                  className="wp-postcode"
                  onClick={(e) => {
                    navigator.clipboard?.writeText(postcode.postcode);
                    e.currentTarget.classList.add("copied");
                  }}
                >
                  {postcode.postcode}
                  {postcode.approx ? " ≈" : ""}
                </button>
              ) : (
                <span className="modal__pending">loading…</span>
              )}
            </dd>
            <dt>Coordinates</dt>
            <dd className="modal__coords">
              {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
            </dd>
          </dl>

          <div className="modal__actions">
            {wp.website && (
              <a
                className="modal__btn modal__btn--primary"
                href={wp.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Official site ↗
              </a>
            )}
            <a className="modal__btn" href={mapsUrl} target="_blank" rel="noopener noreferrer">
              Navigate ↗
            </a>
            <a className="modal__btn" href={reviewsUrl} target="_blank" rel="noopener noreferrer">
              Reviews ↗
            </a>
            <button className="modal__btn" onClick={share}>
              {shareState === "copied" ? "Copied ✓" : shareState === "shared" ? "Shared ✓" : "Share"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
