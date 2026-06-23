import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  IconPhoto,
  IconVideo,
  IconCube,
  IconCloudUpload,
} from "@tabler/icons-react";
import { Spinner } from "@/components/ui/spinner";
import type { MediaInfo, ExploreMediaFile } from "@/api/MediaApi";
import { getMediaThumbnailUrl } from "@/api/MediaApi";
import { MediaDetailModal } from "@/components/MediaDetailModal";

export type MediaCardCreator = {
  username: string;
  display_name?: string;
  gravatar_hash?: string;
};

interface MediaCardProps {
  item: MediaInfo | ExploreMediaFile;
  showCreator?: boolean;
  /** Override or fallback when the item doesn't embed a creator (e.g. on a user profile page). */
  creator?: MediaCardCreator | null;
  onSelect?: (item: MediaInfo | ExploreMediaFile) => void;
}

const classIcons: Record<string, typeof IconPhoto> = {
  video: IconVideo,
  dimensional: IconCube,
};

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatCreatedAt(iso: string): { short: string; full: string } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const short =
    d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  const full = d.toLocaleString();
  return { short, full };
}

export function MediaCard({
  item,
  showCreator,
  creator: creatorOverride,
  onSelect,
}: MediaCardProps) {
  const thumbnailUrl = getMediaThumbnailUrl(item, 512);
  const mediaClass = item.media_class;
  const FallbackIcon = classIcons[mediaClass] ?? IconPhoto;
  const embeddedCreator =
    "maybe_creator" in item ? item.maybe_creator : undefined;
  const creator: MediaCardCreator | null | undefined =
    creatorOverride ?? embeddedCreator;
  const durationMs =
    "maybe_duration_millis" in item ? item.maybe_duration_millis : undefined;
  const createdAt = item.created_at ? formatCreatedAt(item.created_at) : null;
  const [imgLoaded, setImgLoaded] = useState(!thumbnailUrl);
  const [retryCount, setRetryCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const imgSrc = thumbnailUrl
    ? thumbnailUrl +
      (retryCount
        ? `${thumbnailUrl.includes("?") ? "&" : "?"}_r=${retryCount}`
        : "")
    : undefined;

  const handleError = () => {
    setTimeout(() => setRetryCount((c) => c + 1), 5000);
  };

  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(item);
    } else {
      setModalOpen(true);
    }
  }, [onSelect, item]);

  const isUserUpload = Boolean(
    (item as { is_user_upload?: boolean }).is_user_upload,
  );
  const hoverLabel = !isUserUpload
    ? item.maybe_title || item.maybe_text_transcript
    : undefined;
  const hasMetaFooter = showCreator && creator;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick();
        }}
        draggable={false}
        className="group relative rounded-xl overflow-hidden border bg-muted/30 cursor-pointer aspect-square"
      >
        {/* Top-left: media class + upload indicator */}
        <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 flex-wrap">
          <span className="px-2 py-1 rounded-md bg-black/40 text-[10px] font-medium text-white backdrop-blur-sm uppercase">
            {mediaClass === "dimensional" ? "3D" : mediaClass || "Unknown"}
          </span>
          {isUserUpload && (
            <span
              className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-black/40 text-[10px] font-medium text-white backdrop-blur-sm uppercase"
              title="User upload"
            >
              <IconCloudUpload className="size-3" />
              Uploaded
            </span>
          )}
        </div>

        {/* Top-right: created date/time + (optional) duration */}
        <div className="absolute top-1.5 right-1.5 z-10 flex flex-col items-end gap-1">
          {createdAt && (
            <span
              className="px-1.5 py-0.5 rounded-md bg-black/50 text-[10px] font-medium text-white backdrop-blur-sm tabular-nums whitespace-nowrap"
              title={createdAt.full}
            >
              {createdAt.short}
            </span>
          )}
          {durationMs != null && durationMs > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-black/50 text-[10px] font-medium text-white backdrop-blur-sm tabular-nums">
              {formatDuration(durationMs)}
            </span>
          )}
        </div>

        {/* Thumbnail or fallback */}
        {imgSrc ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner className="size-5 opacity-40" />
              </div>
            )}
            <img
              src={imgSrc}
              alt={item.maybe_title || item.token}
              className={`w-full h-full transition-transform group-hover:scale-105 object-contain ${!imgLoaded ? "opacity-0" : "opacity-100"}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={handleError}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <FallbackIcon className="size-14 opacity-30" />
          </div>
        )}

        {/* Hover overlay — title / transcript (sits above the always-visible meta strip) */}
        {hoverLabel && (
          <div className="absolute inset-x-0 top-0 bottom-14 bg-linear-to-b from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-start p-3 pointer-events-none z-10">
            <div className="text-xs text-white/95 line-clamp-4">
              {hoverLabel}
            </div>
          </div>
        )}

        {/* Always-visible metadata overlay (bottom): creator + token */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-2.5 pb-2 pt-8 bg-linear-to-t from-black/85 via-black/55 to-transparent flex flex-col gap-0.5 min-w-0">
          {hasMetaFooter && (
            <Link
              to={`/user/profile/${creator!.username}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-white truncate hover:underline"
              title={creator!.display_name || creator!.username}
            >
              @{creator!.username}
            </Link>
          )}
          <span
            className="font-mono text-[10px] text-white/55 truncate"
            title={item.token}
          >
            {item.token}
          </span>
        </div>
      </div>

      {!onSelect && (
        <MediaDetailModal
          item={item}
          creator={creatorOverride ?? undefined}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </>
  );
}
