import { memo, useCallback, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCube, faImage, faVideo } from "@fortawesome/pro-solid-svg-icons";
import {
  getCreatorIconPathForModelId,
  getModelDisplayName,
} from "@storyteller/model-list";
import { GalleryThumbnail } from "./GalleryThumbnail";
import type { GalleryItem } from "./types";

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

export interface GalleryCardProps {
  item: GalleryItem;
  onClick: (item: GalleryItem) => void;
  // "auto" = dynamic aspect ratio from the loaded image (masonry layouts).
  // "square" = fixed 1:1; skips the ratio measurement path (uniform grids).
  shape?: "auto" | "square";
  /** Hover-revealed quick-action cluster (recreate / share / download …). */
  actionsSlot?: ReactNode;
}

export const GalleryCard = memo(function GalleryCard({
  item,
  onClick,
  shape = "auto",
  actionsSlot,
}: GalleryCardProps) {
  const isSquare = shape === "square";
  const cached = aspectRatioCache.get(item.id);
  const [ratio, setRatio] = useState<number | undefined>(cached);

  const isVideo = item.mediaClass === "video";
  const is3D = item.mediaClass === "dimensional";
  const mediaIcon = isVideo ? faVideo : is3D ? faCube : faImage;
  const mediaLabel = isVideo ? "Video" : is3D ? "3D" : "Image";
  const modelDisplayName = item.modelId
    ? getModelDisplayName(item.modelId)
    : null;
  const modelIconPath = item.modelId
    ? getCreatorIconPathForModelId(item.modelId)
    : null;

  const displayRatio = ratio ? Math.min(ratio, MAX_RATIO) : 1;

  // In square mode the wrapper sets the ratio via `aspect-square`; we only
  // compute the dynamic aspectRatio for masonry-style layouts.
  const outerStyle: React.CSSProperties | undefined = isSquare
    ? undefined
    : { aspectRatio: `1 / ${displayRatio}` };

  const measureRatio = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (cached != null) return;
      const img = e.currentTarget;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const r = img.naturalHeight / img.naturalWidth;
        aspectRatioCache.set(item.id, r);
        persistCache(aspectRatioCache);
        setRatio(r);
      }
    },
    [cached, item.id],
  );

  const handleCardClick = useCallback(() => {
    onClick(item);
  }, [item, onClick]);

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(item);
      }
    },
    [item, onClick],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={`group relative block w-full rounded-lg bg-ui-controls/40 leading-none transition-shadow hover:ring-2 hover:ring-primary-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 cursor-pointer ${isSquare ? "aspect-square" : ""}`}
      style={outerStyle}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {/* Media layer — kept in its own overflow-hidden box so the hover
          overlay below (including tooltips from the action pill) can render
          outside the card's rounded corners without being clipped. */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[inherit]"
        style={{ contentVisibility: "auto", containIntrinsicSize: "auto 200px" }}
      >
        <GalleryThumbnail
          thumbnail={item.thumbnail}
          alt={item.label}
          isVideo={isVideo}
          fallbackIcon={mediaIcon}
          onLoad={measureRatio}
        />
      </div>

      {/* Hover overlay with media type + model badges and quick actions */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="pointer-events-auto flex min-w-0 flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white/90">
            <FontAwesomeIcon icon={mediaIcon} className="text-[10px]" />
            {mediaLabel}
          </div>
          {modelDisplayName && modelIconPath && (
            <div className="flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white/80">
              <img
                src={modelIconPath}
                alt=""
                className="h-3 w-3 icon-auto-contrast"
              />
              <span className="max-w-[100px] truncate">{modelDisplayName}</span>
            </div>
          )}
        </div>

        {actionsSlot && (
          <div className="pointer-events-auto flex shrink-0 items-center gap-0.5 rounded-lg bg-black/60 p-1 backdrop-blur-sm">
            {actionsSlot}
          </div>
        )}
      </div>
    </div>
  );
});
