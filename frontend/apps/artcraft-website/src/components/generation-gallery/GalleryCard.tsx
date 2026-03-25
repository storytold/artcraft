import { memo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCube, faImage, faVideo } from "@fortawesome/pro-solid-svg-icons";
import { PLACEHOLDER_IMAGES } from "@storyteller/common";
import type { GalleryItem } from "./useGalleryData";

// ── Persistent aspect ratio cache ─────────────────────────────────────────
// Survives in-memory across navigations, and in sessionStorage across
// refreshes so cards never flash as squares on reload.

const STORAGE_KEY = "gallery-aspect-ratios";

function loadCache(): Map<string, number> {
  const map = new Map<string, number>();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, number>;
      for (const [k, v] of Object.entries(parsed)) {
        map.set(k, v);
      }
    }
  } catch {
    // ignore
  }
  return map;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persistCache(cache: Map<string, number>) {
  // Debounce — batch writes instead of writing on every image load
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const entries = [...cache.entries()];
      const trimmed = entries.slice(-500);
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Object.fromEntries(trimmed)),
      );
    } catch {
      // ignore
    }
  }, 1000);
}

export const aspectRatioCache = loadCache();

// ── Component ──────────────────────────────────────────────────────────────

interface GalleryCardProps {
  item: GalleryItem;
  onClick: (item: GalleryItem) => void;
}

export const GalleryCard = memo(function GalleryCard({
  item,
  onClick,
}: GalleryCardProps) {
  const cached = aspectRatioCache.has(item.id);
  const [, setLoaded] = useState(cached);

  return (
    <button
      className="group relative h-full w-full overflow-hidden rounded-lg bg-ui-controls/40 transition-shadow hover:ring-2 hover:ring-primary-400/60 focus:outline-none focus:ring-2 focus:ring-primary-400"
      style={{ contentVisibility: "auto" }}
      onClick={() => onClick(item)}
    >
      {item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt={item.label}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onLoad={(e) => {
            if (cached) return;
            const img = e.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              aspectRatioCache.set(
                item.id,
                img.naturalHeight / img.naturalWidth,
              );
              persistCache(aspectRatioCache);
              setLoaded(true);
            }
          }}
          onError={(e) => {
            const target = e.currentTarget;
            if (target.dataset.fallback) return;
            target.dataset.fallback = "1";
            target.src = PLACEHOLDER_IMAGES.DEFAULT;
            target.style.opacity = "0.3";
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <FontAwesomeIcon
            icon={
              item.mediaClass === "video"
                ? faVideo
                : item.mediaClass === "dimensional"
                  ? faCube
                  : faImage
            }
            className="text-xl text-white/20"
          />
        </div>
      )}
      {item.mediaClass === "video" && (
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80">
          <FontAwesomeIcon icon={faVideo} className="text-[8px]" />
          Video
        </div>
      )}
      {item.mediaClass === "dimensional" && (
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80">
          <FontAwesomeIcon icon={faCube} className="text-[8px]" />
          3D
        </div>
      )}
    </button>
  );
});
