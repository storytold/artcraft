import { useCallback } from "react";
import { LoaderCircleIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { PLACEHOLDER_IMAGES } from "@storyteller/common";
import { useGalleryViewStore } from "./gallery-view-store";
import {
  markVideoThumbnailFailed,
  useVideoThumbnailState,
} from "./pending-video-thumbnails";

// Media thumbnail shared by the masonry GalleryCard and the list GalleryRow.
// Encapsulates the two awkward bits of thumbnail rendering: freshly generated
// video thumbnails 404 until the render job finishes (so failed ones are
// marked and re-checked in the background, see pending-video-thumbnails), and
// broken image URLs fall back to a placeholder.

// ── Component ──────────────────────────────────────────────────────────────

interface GalleryThumbnailProps {
  thumbnail: string | null;
  // Still first-frame variant for videos. Shown instead of the (animated)
  // thumbnail when the user turns off autoplay in useGalleryViewStore.
  stillThumbnail?: string | null;
  alt: string;
  isVideo: boolean;
  // Icon shown when there is no thumbnail at all (e.g. 3D meshes).
  fallbackIcon: LucideIcon;
  // Classes for the <img> element (sizing / object-fit).
  imgClassName?: string;
  fallbackIconClassName?: string;
  // The "Loading thumbnail…" caption is too large for small list rows.
  showRetryLabel?: boolean;
  // Called on successful load — the card uses it to measure aspect ratio.
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export function GalleryThumbnail({
  thumbnail: animatedThumbnail,
  stillThumbnail,
  alt,
  isVideo,
  fallbackIcon,
  imgClassName = "block h-full w-full object-cover",
  fallbackIconClassName = "text-xl text-white/20",
  showRetryLabel = true,
  onLoad,
}: GalleryThumbnailProps) {
  const autoplayVideos = useGalleryViewStore((s) => s.autoplayVideos);
  // With autoplay off, videos freeze on their still first frame. The still is
  // also what gets re-checked in that mode.
  const thumbnail =
    isVideo && !autoplayVideos && stillThumbnail
      ? stillThumbnail
      : animatedThumbnail;
  const videoState = useVideoThumbnailState(isVideo ? thumbnail : null);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (isVideo) {
        if (thumbnail) markVideoThumbnailFailed(thumbnail);
      } else {
        const target = e.currentTarget;
        if (target.dataset.fallback) return;
        target.dataset.fallback = "1";
        target.src = PLACEHOLDER_IMAGES.DEFAULT;
        target.style.opacity = "0.3";
      }
    },
    [isVideo, thumbnail],
  );

  if (videoState?.status === "pending") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        <LoaderCircleIcon className="animate-spin text-lg text-white/30" />
        {showRetryLabel && (
          <span className="text-[10px] text-white/30">Loading thumbnail…</span>
        )}
      </div>
    );
  }

  // Loaded after a re-check: render the (cache-busted) URL that worked.
  const src = videoState?.status === "ready" ? videoState.src : thumbnail;

  if (src && videoState?.status !== "gave_up") {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={imgClassName}
        onLoad={onLoad}
        onError={handleError}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <DynamicIcon icon={fallbackIcon} className={fallbackIconClassName} />
    </div>
  );
}
