import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownToLine,
  faArrowRotateRight,
  faCheck,
  faCube,
  faImage,
  faLink,
  faSpinnerThird,
  faVideo,
} from "@fortawesome/pro-solid-svg-icons";
import { PLACEHOLDER_IMAGES } from "@storyteller/common";
import { Tooltip } from "@storyteller/ui-tooltip";
import { toast } from "../toast/toast";
import { downloadMediaFile } from "../../lib/download-media";
import {
  getModelCreatorIconPath,
  getModelDisplayName,
} from "../../lib/omni-gen-hooks";
import {
  applyRecreateFromMediaToken,
  type RecreateMediaClass,
} from "../../lib/recreate";
import { SHARE_URL_BASE } from "../lightbox/shared";
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

// ── Shared visibility listener for video thumbnail retries ────────────────

const visibilityCallbacks = new Set<() => void>();

function onTabVisible(cb: () => void) {
  visibilityCallbacks.add(cb);
  if (visibilityCallbacks.size === 1) {
    document.addEventListener("visibilitychange", fireVisibilityCallbacks);
  }
  return () => {
    visibilityCallbacks.delete(cb);
    if (visibilityCallbacks.size === 0) {
      document.removeEventListener(
        "visibilitychange",
        fireVisibilityCallbacks,
      );
    }
  };
}

function fireVisibilityCallbacks() {
  if (document.hidden) return;
  visibilityCallbacks.forEach((cb) => cb());
}

// ── Video thumbnail retry constants ───────────────────────────────────────

const MAX_RETRIES = 20;
const RETRY_INTERVAL = 5000;

// ── Component ──────────────────────────────────────────────────────────────

interface GalleryCardProps {
  item: GalleryItem;
  onClick: (item: GalleryItem) => void;
  // "auto" = dynamic aspect ratio from the loaded image (masonry layouts).
  // "square" = fixed 1:1; skips the ratio measurement path (uniform grids).
  shape?: "auto" | "square";
}

export const GalleryCard = memo(function GalleryCard({
  item,
  onClick,
  shape = "auto",
}: GalleryCardProps) {
  const isSquare = shape === "square";
  const navigate = useNavigate();
  const cached = aspectRatioCache.get(item.id);
  const [ratio, setRatio] = useState<number | undefined>(cached);
  const [shareCopied, setShareCopied] = useState(false);
  const [isRecreating, setIsRecreating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const isVideo = item.mediaClass === "video";
  const is3D = item.mediaClass === "dimensional";
  const recreateMediaClass: RecreateMediaClass | null = isVideo
    ? "video"
    : is3D
      ? null
      : "image";

  // Video thumbnail retry — "retrying" flips to true only after the first
  // error, so videos with ready thumbnails render the normal <img> path
  // with zero overhead. While retrying, a hidden <img> loads via ref
  // (no re-renders) and the spinner stays stable until success.
  const [retrying, setRetrying] = useState(false);
  const retryImgRef = useRef<HTMLImageElement>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const retryCountRef = useRef(0);

  const kickRetry = useCallback(() => {
    if (!retryImgRef.current || !item.thumbnail) return;
    retryImgRef.current.src = `${item.thumbnail}?_r=${Date.now()}`;
  }, [item.thumbnail]);

  const scheduleRetry = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES || !item.thumbnail) return;
    if (document.hidden) return;
    retryTimerRef.current = setTimeout(() => {
      retryCountRef.current++;
      kickRetry();
    }, RETRY_INTERVAL);
  }, [item.thumbnail, kickRetry]);

  // Subscribe to shared visibility listener for retrying video cards
  useEffect(() => {
    if (!isVideo || !item.thumbnail || !retrying) return;
    const unsubscribe = onTabVisible(() => {
      retryCountRef.current = 0;
      kickRetry();
    });
    return () => {
      unsubscribe();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [isVideo, item.thumbnail, retrying, kickRetry]);

  // Reset retry state when thumbnail URL changes
  useEffect(() => {
    if (!isVideo) return;
    setRetrying(false);
    retryCountRef.current = 0;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, [isVideo, item.thumbnail]);

  const displayRatio = ratio ? Math.min(ratio, MAX_RATIO) : 1;

  // In square mode the wrapper sets the ratio via `aspect-square`; we only
  // compute the dynamic aspectRatio for masonry-style layouts.
  const outerStyle: React.CSSProperties | undefined = isSquare
    ? undefined
    : { aspectRatio: `1 / ${displayRatio}` };

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

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (isVideo && retrying) {
        setRetrying(false);
        retryCountRef.current = 0;
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      }
      if (cached != null) return;
      const img = e.currentTarget;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const r = img.naturalHeight / img.naturalWidth;
        aspectRatioCache.set(item.id, r);
        persistCache(aspectRatioCache);
        setRatio(r);
      }
    },
    [isVideo, retrying, cached, item.id],
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (isVideo) {
        setRetrying(true);
        scheduleRetry();
      } else {
        const target = e.currentTarget;
        if (target.dataset.fallback) return;
        target.dataset.fallback = "1";
        target.src = PLACEHOLDER_IMAGES.DEFAULT;
        target.style.opacity = "0.3";
      }
    },
    [isVideo, scheduleRetry],
  );

  const handleRecreate = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!recreateMediaClass || isRecreating) return;
      setIsRecreating(true);
      try {
        await applyRecreateFromMediaToken(item.id, recreateMediaClass, navigate);
      } finally {
        setIsRecreating(false);
      }
    },
    [item.id, recreateMediaClass, navigate, isRecreating],
  );

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(`${SHARE_URL_BASE}${item.id}`);
        toast.success("Share link copied");
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
      } catch {
        toast.error("Unable to copy link");
      }
    },
    [item.id],
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

  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!item.fullImage || isDownloading) return;
      setIsDownloading(true);
      try {
        await downloadMediaFile({
          url: item.fullImage,
          filename: `artcraft-${item.id}`,
          mediaClass: item.mediaClass,
        });
      } finally {
        setIsDownloading(false);
      }
    },
    [item.fullImage, item.id, item.mediaClass, isDownloading],
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
        {retrying ? (
          <>
            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
              <FontAwesomeIcon
                icon={faSpinnerThird}
                className="animate-spin text-lg text-white/30"
              />
              <span className="text-[10px] text-white/30">
                Loading thumbnail…
              </span>
            </div>
            {/* Hidden img retries in background via ref — zero re-renders */}
            <img
              ref={retryImgRef}
              src={item.thumbnail!}
              alt=""
              className="absolute h-0 w-0 opacity-0"
              aria-hidden
              onLoad={handleLoad}
              onError={handleError}
            />
          </>
        ) : item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.label}
            loading="lazy"
            decoding="async"
            className="block h-full w-full object-cover"
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FontAwesomeIcon icon={mediaIcon} className="text-xl text-white/20" />
          </div>
        )}
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

        <div className="pointer-events-auto flex shrink-0 items-center gap-0.5 rounded-lg bg-black/60 p-1 backdrop-blur-sm">
          {recreateMediaClass && (
            <Tooltip content="Recreate" position="top">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-60"
                onClick={handleRecreate}
                disabled={isRecreating}
                aria-label="Recreate"
              >
                <FontAwesomeIcon
                  icon={isRecreating ? faSpinnerThird : faArrowRotateRight}
                  className={`text-sm ${isRecreating ? "animate-spin" : ""}`}
                />
              </button>
            </Tooltip>
          )}
          <Tooltip content={shareCopied ? "Copied" : "Share"} position="top">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/15 hover:text-white"
              onClick={handleShare}
              aria-label="Share"
            >
              <FontAwesomeIcon
                icon={shareCopied ? faCheck : faLink}
                className="text-sm"
              />
            </button>
          </Tooltip>
          {item.fullImage && (
            <Tooltip content="Download" position="top">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-60"
                aria-label="Download"
              >
                <FontAwesomeIcon
                  icon={isDownloading ? faSpinnerThird : faArrowDownToLine}
                  className={`text-sm ${isDownloading ? "animate-spin" : ""}`}
                />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
});
