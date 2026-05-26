import { memo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownToLine,
  faArrowRotateRight,
  faCheck,
  faLink,
  faPlay,
  faSpinnerThird,
  faVideo,
} from "@fortawesome/pro-solid-svg-icons";
import { Tooltip } from "@storyteller/ui-tooltip";
import { GalleryThumbnail } from "./GalleryThumbnail";
import { useGalleryItemActions } from "./useGalleryItemActions";
import { formatTimeAgo } from "../../lib/format-time-ago";
import type { GalleryItem } from "./useGalleryData";

interface GalleryRowProps {
  item: GalleryItem;
  onClick: (item: GalleryItem) => void;
  enableMakeVideo?: boolean;
  // Prompt + model resolved from the prompt record by the list. Fall back to
  // the item's own fields when the prompt hasn't loaded (or has no text).
  title?: string;
  modelId?: string;
}

export const GalleryRow = memo(function GalleryRow({
  item,
  onClick,
  enableMakeVideo = false,
  title,
  modelId,
}: GalleryRowProps) {
  const {
    isVideo,
    mediaIcon,
    mediaLabel,
    modelDisplayName,
    modelIconPath,
    recreateMediaClass,
    canMakeVideo,
    isRecreating,
    isDownloading,
    shareCopied,
    handleRecreate,
    handleMakeVideo,
    handleShare,
    handleDownload,
  } = useGalleryItemActions(item, { enableMakeVideo, modelId });

  const handleRowClick = useCallback(() => onClick(item), [item, onClick]);
  const handleRowKeyDown = useCallback(
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
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-ui-controls/40 leading-none">
        <GalleryThumbnail
          thumbnail={item.thumbnail}
          alt={item.label}
          isVideo={isVideo}
          fallbackIcon={mediaIcon}
          fallbackIconClassName="text-base text-white/20"
          showRetryLabel={false}
        />
        {isVideo && item.thumbnail && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
              <FontAwesomeIcon
                icon={faPlay}
                className="ml-0.5 text-[9px] text-white/90"
              />
            </span>
          </div>
        )}
      </div>

      {/* Title + model / media meta */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-snug text-white/90">
          {title || item.label}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
          {modelIconPath && (
            <img
              src={modelIconPath}
              alt=""
              className="h-3 w-3 shrink-0 icon-auto-contrast"
            />
          )}
          <span className="truncate">{modelDisplayName ?? mediaLabel}</span>
          {modelDisplayName && (
            <>
              <span className="text-white/25">·</span>
              <span className="shrink-0">{mediaLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Quick actions (hover) + timestamp */}
      <div className="flex shrink-0 items-center gap-1">
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {recreateMediaClass && (
            <Tooltip content="Recreate" position="top">
              <button
                type="button"
                onClick={handleRecreate}
                disabled={isRecreating}
                aria-label="Recreate"
                className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                <FontAwesomeIcon
                  icon={isRecreating ? faSpinnerThird : faArrowRotateRight}
                  className={`text-sm ${isRecreating ? "animate-spin" : ""}`}
                />
              </button>
            </Tooltip>
          )}
          {canMakeVideo && (
            <Tooltip content="Make Video" position="top">
              <button
                type="button"
                onClick={handleMakeVideo}
                aria-label="Make Video"
                className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <FontAwesomeIcon icon={faVideo} className="text-sm" />
              </button>
            </Tooltip>
          )}
          <Tooltip content={shareCopied ? "Copied" : "Share"} position="top">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share"
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
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
                aria-label="Download"
                className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                <FontAwesomeIcon
                  icon={isDownloading ? faSpinnerThird : faArrowDownToLine}
                  className={`text-sm ${isDownloading ? "animate-spin" : ""}`}
                />
              </button>
            </Tooltip>
          )}
        </div>
        <span className="w-24 shrink-0 whitespace-nowrap text-right text-xs text-white/40">
          {formatTimeAgo(item.createdAt)}
        </span>
      </div>
    </div>
  );
});
