import { memo, useCallback, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCube, faImage, faPlay, faVideo } from "@fortawesome/pro-solid-svg-icons";
import {
  getCreatorIconPathForModelId,
  getModelDisplayName,
} from "@storyteller/model-list";
import { GalleryThumbnail } from "./GalleryThumbnail";
import { CopyPromptButton } from "./CopyPromptButton";
import { formatTimeAgo } from "./format-time-ago";
import type { GalleryItem } from "./types";

export interface GalleryRowProps {
  item: GalleryItem;
  onClick: (item: GalleryItem) => void;
  // Prompt + model resolved from the prompt record by the list. Fall back to
  // the item's own fields when the prompt hasn't loaded (or has no text).
  title?: string;
  modelId?: string;
  // The prompt record is still resolving — show a skeleton in place of the title.
  loading?: boolean;
  /** Hover-revealed quick-action cluster (recreate / share / download …). */
  actionsSlot?: ReactNode;
  onCopyPromptResult?: (success: boolean) => void;
}

export const GalleryRow = memo(function GalleryRow({
  item,
  onClick,
  title,
  modelId,
  loading = false,
  actionsSlot,
  onCopyPromptResult,
}: GalleryRowProps) {
  const isVideo = item.mediaClass === "video";
  const is3D = item.mediaClass === "dimensional";
  const mediaIcon = isVideo ? faVideo : is3D ? faCube : faImage;
  const mediaLabel = isVideo ? "Video" : is3D ? "3D" : "Image";

  const effectiveModelId = modelId ?? item.modelId;
  const modelDisplayName = effectiveModelId
    ? getModelDisplayName(effectiveModelId)
    : null;
  const modelIconPath = effectiveModelId
    ? getCreatorIconPathForModelId(effectiveModelId)
    : null;

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

  const timeAgo = formatTimeAgo(item.createdAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
    >
      {/* Thumbnail */}
      <div className="relative size-[100px] shrink-0 overflow-hidden rounded-md bg-ui-controls/40 leading-none">
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
        {loading ? (
          <div className="relative h-4 w-2/3 max-w-[280px] overflow-hidden rounded bg-white/[0.06]">
            <div className="animate-shimmer absolute inset-0" />
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <p className="line-clamp-3 min-w-0 flex-1 text-sm leading-snug text-white/90">
              {title || item.label}
            </p>
            {title && (
              <CopyPromptButton
                text={title}
                onCopyResult={onCopyPromptResult}
              />
            )}
          </div>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-white/45">
          {modelIconPath && (
            <img
              src={modelIconPath}
              alt=""
              className="h-3 w-3 shrink-0 icon-auto-contrast"
            />
          )}
          <span className="max-w-[40vw] truncate sm:max-w-none">
            {modelDisplayName ?? mediaLabel}
          </span>
          {modelDisplayName && (
            <>
              <span className="text-white/25">·</span>
              <span className="shrink-0">{mediaLabel}</span>
            </>
          )}

          {/* Quick actions, right after the media type. Always visible on
              mobile (no hover); hover-revealed on desktop. The prompt above
              spans the full row width either way. */}
          {actionsSlot && (
            <div className="flex shrink-0 items-center gap-0.5 sm:ms-1.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
              {actionsSlot}
            </div>
          )}
          <span className="ml-auto shrink-0 whitespace-nowrap text-white/40">
            {timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
});
