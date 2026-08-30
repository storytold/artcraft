import { memo, useCallback, useState, type ReactNode } from "react";
import { BoxIcon, CheckIcon, EyeIcon, ImageIcon, MusicIcon, VideoIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import {
  getCreatorIconPathForModelId,
  getModelDisplayName,
} from "@storyteller/model-list";
import { WaveformAudioPlayer } from "@storyteller/ui-audio-player";
import { GalleryThumbnail } from "./GalleryThumbnail";
import { is3DMediaClass, type GalleryItem } from "./types";

// ── Persistent aspect ratio cache ─────────────────────────────────────────

const STORAGE_KEY = "gallery-aspect-ratios";

// Cap ratio so tall portraits don't dominate — 1.4 ≈ 5:7
const MAX_RATIO = 1.4;

// Audio cards have no image to measure — fixed square tile.
const AUDIO_RATIO = 1;

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
  /** Prompt text resolved by the view (via the prompts cache). Audio cards
   *  show it inline since they have no image to speak for themselves. */
  title?: string;
  /** Hover-revealed quick-action cluster (recreate / share / download …). */
  actionsSlot?: ReactNode;
  /** Multi-select mode: clicking toggles selection instead of opening the
   *  item, a checkbox chip is shown, and the actions pill is hidden. */
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (item: GalleryItem) => void;
  /** Persistent badge marking the item most recently viewed in the lightbox. */
  lastViewed?: boolean;
}

export const GalleryCard = memo(function GalleryCard({
  item,
  onClick,
  shape = "auto",
  title,
  actionsSlot,
  selectMode = false,
  selected = false,
  onToggleSelect,
  lastViewed = false,
}: GalleryCardProps) {
  const isSquare = shape === "square";
  const cached = aspectRatioCache.get(item.id);
  const [ratio, setRatio] = useState<number | undefined>(cached);

  const isVideo = item.mediaClass === "video";
  const is3D = is3DMediaClass(item.mediaClass);
  const isAudio = item.mediaClass === "audio";
  const mediaIcon = isVideo
    ? VideoIcon
    : is3D
      ? BoxIcon
      : isAudio
        ? MusicIcon
        : ImageIcon;
  const mediaLabel = isVideo
    ? "Video"
    : is3D
      ? "3D"
      : isAudio
        ? "Audio"
        : "Image";
  const modelDisplayName = item.modelId
    ? getModelDisplayName(item.modelId)
    : null;
  const modelIconPath = item.modelId
    ? getCreatorIconPathForModelId(item.modelId)
    : null;

  const displayRatio = isAudio
    ? AUDIO_RATIO
    : ratio
      ? Math.min(ratio, MAX_RATIO)
      : 1;

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
    if (selectMode) {
      // Only downloadable (completed, URL-bearing) items are selectable.
      if (item.fullImage) onToggleSelect?.(item);
      return;
    }
    onClick(item);
  }, [item, onClick, selectMode, onToggleSelect]);

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCardClick();
      }
    },
    [handleCardClick],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={`group relative block w-full rounded-lg bg-ui-controls/40 leading-none transition-shadow hover:ring-2 hover:ring-primary-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 cursor-pointer ${isSquare ? "aspect-square" : ""} ${selected ? "ring-2 ring-primary-400" : lastViewed ? "ring-2 ring-primary-400/50" : ""}`}
      style={outerStyle}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {/* Media layer — kept in its own overflow-hidden box so the hover
          overlay below (including tooltips from the action pill) can render
          outside the card's rounded corners without being clipped. */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[inherit]"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "auto 200px",
        }}
      >
        {isAudio ? (
          <div className="flex h-full flex-col bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] p-3">
            <p className="line-clamp-2 shrink-0 text-sm leading-snug text-white/85">
              {title || item.label}
            </p>
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                <MusicIcon
                  
                  className="text-xl text-white/70" />
              </div>
            </div>
            {item.fullImage && (
              <div className="w-full shrink-0">
                <WaveformAudioPlayer
                  src={item.fullImage}
                  durationMillis={item.durationMillis}
                />
              </div>
            )}
          </div>
        ) : (
          <GalleryThumbnail
            thumbnail={item.thumbnail}
            stillThumbnail={item.stillThumbnail}
            alt={item.label}
            isVideo={isVideo}
            fallbackIcon={mediaIcon}
            onLoad={measureRatio}
          />
        )}
      </div>

      {/* Selection checkbox chip (select mode only) */}
      {selectMode && item.fullImage && (
        <div
          className={`pointer-events-none absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
            selected
              ? "border-primary-400 bg-primary-400 text-white"
              : "border-white/60 bg-black/40 text-transparent"
          }`}
        >
          <CheckIcon  className="text-[10px]" />
        </div>
      )}

      {/* Persistent "Last viewed" badge (stays until another item is opened
          in the lightbox). Top-right so it never collides with the selection
          checkbox chip at top-left. */}
      {lastViewed && (
        <div className="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80">
          <EyeIcon />
          Last viewed
        </div>
      )}

      {/* Hover overlay with media type + model badges and quick actions */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t rounded-b-lg from-black/70 to-transparent px-2 pb-2 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="pointer-events-auto flex min-w-0 flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white/90">
            <DynamicIcon icon={mediaIcon} className="text-[10px]" />
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

        {actionsSlot && !selectMode && (
          <div className="pointer-events-auto flex shrink-0 items-center gap-0.5 rounded-lg bg-black/60 p-1 backdrop-blur-sm">
            {actionsSlot}
          </div>
        )}
      </div>
    </div>
  );
});
