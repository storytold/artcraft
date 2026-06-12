import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { PLACEHOLDER_IMAGES } from "@storyteller/common";

// Media thumbnail shared by the masonry GalleryCard and the list GalleryRow.
// Encapsulates the two awkward bits of thumbnail rendering: freshly generated
// video thumbnails 404 until the render job finishes (so we retry on a timer
// and on tab refocus), and broken image URLs fall back to a placeholder.

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
      document.removeEventListener("visibilitychange", fireVisibilityCallbacks);
    }
  };
}

function fireVisibilityCallbacks() {
  if (document.hidden) return;
  visibilityCallbacks.forEach((cb) => cb());
}

// ── Retry constants ────────────────────────────────────────────────────────

const MAX_RETRIES = 20;
const RETRY_INTERVAL = 5000;

// ── Component ──────────────────────────────────────────────────────────────

interface GalleryThumbnailProps {
  thumbnail: string | null;
  alt: string;
  isVideo: boolean;
  // Icon shown when there is no thumbnail at all (e.g. 3D meshes).
  fallbackIcon: IconDefinition;
  // Classes for the <img> element (sizing / object-fit).
  imgClassName?: string;
  fallbackIconClassName?: string;
  // The "Loading thumbnail…" caption is too large for small list rows.
  showRetryLabel?: boolean;
  // Called on successful load — the card uses it to measure aspect ratio.
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export function GalleryThumbnail({
  thumbnail,
  alt,
  isVideo,
  fallbackIcon,
  imgClassName = "block h-full w-full object-cover",
  fallbackIconClassName = "text-xl text-white/20",
  showRetryLabel = true,
  onLoad,
}: GalleryThumbnailProps) {
  // "retrying" flips to true only after the first error, so videos with ready
  // thumbnails render the normal <img> path with zero overhead. While retrying,
  // a hidden <img> loads via ref (no re-renders) and the spinner stays stable.
  const [retrying, setRetrying] = useState(false);
  const retryImgRef = useRef<HTMLImageElement>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const retryCountRef = useRef(0);

  const kickRetry = useCallback(() => {
    if (!retryImgRef.current || !thumbnail) return;
    retryImgRef.current.src = `${thumbnail}?_r=${Date.now()}`;
  }, [thumbnail]);

  const scheduleRetry = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES || !thumbnail) return;
    if (document.hidden) return;
    retryTimerRef.current = setTimeout(() => {
      retryCountRef.current++;
      kickRetry();
    }, RETRY_INTERVAL);
  }, [thumbnail, kickRetry]);

  // Subscribe to the shared visibility listener while a video card is retrying.
  useEffect(() => {
    if (!isVideo || !thumbnail || !retrying) return;
    const unsubscribe = onTabVisible(() => {
      retryCountRef.current = 0;
      kickRetry();
    });
    return () => {
      unsubscribe();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [isVideo, thumbnail, retrying, kickRetry]);

  // Reset retry state when the thumbnail URL changes.
  useEffect(() => {
    if (!isVideo) return;
    setRetrying(false);
    retryCountRef.current = 0;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, [isVideo, thumbnail]);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (isVideo && retrying) {
        setRetrying(false);
        retryCountRef.current = 0;
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      }
      onLoad?.(e);
    },
    [isVideo, retrying, onLoad],
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

  if (retrying) {
    return (
      <>
        <div className="flex h-full w-full flex-col items-center justify-center gap-2">
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="animate-spin text-lg text-white/30"
          />
          {showRetryLabel && (
            <span className="text-[10px] text-white/30">Loading thumbnail…</span>
          )}
        </div>
        {/* Hidden img retries in the background via ref — zero re-renders */}
        <img
          ref={retryImgRef}
          src={thumbnail!}
          alt=""
          className="absolute h-0 w-0 opacity-0"
          aria-hidden
          onLoad={handleLoad}
          onError={handleError}
        />
      </>
    );
  }

  if (thumbnail) {
    return (
      <img
        src={thumbnail}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={imgClassName}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <FontAwesomeIcon icon={fallbackIcon} className={fallbackIconClassName} />
    </div>
  );
}
