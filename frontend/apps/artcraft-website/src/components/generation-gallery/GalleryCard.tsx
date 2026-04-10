import { memo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCube, faImage, faVideo } from "@fortawesome/pro-solid-svg-icons";
import { PLACEHOLDER_IMAGES } from "@storyteller/common";
import {
  getModelCreatorIconPath,
  getModelDisplayName,
} from "../../lib/omni-gen-hooks";
import type { GalleryItem } from "./useGalleryData";

// ── Persistent aspect ratio cache ─────────────────────────────────────────

const STORAGE_KEY = "gallery-aspect-ratios";

// Cap ratio so tall portraits don't dominate — 1.4 ≈ 5:7
const MAX_RATIO = 1.4;

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
  const cached = aspectRatioCache.get(item.id);
  const [ratio, setRatio] = useState<number | undefined>(cached);

  // Use the capped ratio for the card's own aspect-ratio so it sizes itself
  // correctly inside the masonry column. Image uses object-cover to fill.
  const displayRatio = ratio ? Math.min(ratio, MAX_RATIO) : 1;

  const style: React.CSSProperties = {
    aspectRatio: `1 / ${displayRatio}`,
    contentVisibility: "auto",
    containIntrinsicSize: "auto 200px",
  };

  const modelDisplayName = item.modelId
    ? getModelDisplayName(item.modelId)
    : null;
  const modelIconPath = item.modelId
    ? getModelCreatorIconPath(item.modelId)
    : null;

  const mediaIcon =
    item.mediaClass === "video"
      ? faVideo
      : item.mediaClass === "dimensional"
        ? faCube
        : faImage;
  const mediaLabel =
    item.mediaClass === "video"
      ? "Video"
      : item.mediaClass === "dimensional"
        ? "3D"
        : "Image";

  return (
    <button
      className="group relative block w-full overflow-hidden rounded-lg bg-ui-controls/40 leading-none transition-shadow hover:ring-2 hover:ring-primary-400/60 focus:outline-none focus:ring-2 focus:ring-primary-400"
      style={style}
      onClick={() => onClick(item)}
    >
      {item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt={item.label}
          loading="lazy"
          decoding="async"
          className="block h-full w-full object-cover"
          onLoad={(e) => {
            if (cached != null) return;
            const img = e.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              const r = img.naturalHeight / img.naturalWidth;
              aspectRatioCache.set(item.id, r);
              persistCache(aspectRatioCache);
              setRatio(r);
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
            icon={mediaIcon}
            className="text-xl text-white/20"
          />
        </div>
      )}

      {/* Hover overlay with media type + model badges */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80">
          <FontAwesomeIcon icon={mediaIcon} className="text-[8px]" />
          {mediaLabel}
        </div>
        {modelDisplayName && modelIconPath && (
          <div className="flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80">
            <img
              src={modelIconPath}
              alt=""
              className="h-3 w-3 icon-auto-contrast"
            />
            <span className="max-w-[100px] truncate">{modelDisplayName}</span>
          </div>
        )}
      </div>
    </button>
  );
});
