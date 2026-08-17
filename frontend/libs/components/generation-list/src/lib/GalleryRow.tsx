import { memo, useCallback, type ReactNode } from "react";
import { BoxIcon, CheckIcon, ImageIcon, MusicIcon, PlayIcon, VideoIcon } from "lucide-react";
import {
  getCreatorIconPathForModelId,
  getModelDisplayName,
} from "@storyteller/model-list";
import { WaveformAudioPlayer } from "@storyteller/ui-audio-player";
import { GalleryThumbnail } from "./GalleryThumbnail";
import { CopyPromptButton } from "./CopyPromptButton";
import { formatTimeAgo } from "./format-time-ago";
import { is3DMediaClass, type GalleryItem } from "./types";

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
  /** Multi-select mode: clicking toggles selection instead of opening the
   *  item, a leading checkbox is shown, and the actions cluster is hidden. */
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (item: GalleryItem) => void;
  /** Persistent badge marking the item most recently viewed in the lightbox. */
  lastViewed?: boolean;
}

export const GalleryRow = memo(function GalleryRow({
  item,
  onClick,
  title,
  modelId,
  loading = false,
  actionsSlot,
  onCopyPromptResult,
  selectMode = false,
  selected = false,
  onToggleSelect,
  lastViewed = false,
}: GalleryRowProps) {
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
  const mediaLabel = isVideo ? "Video" : is3D ? "3D" : isAudio ? "Audio" : "Image";

  const effectiveModelId = modelId ?? item.modelId;
  const modelDisplayName = effectiveModelId
    ? getModelDisplayName(effectiveModelId)
    : null;
  const modelIconPath = effectiveModelId
    ? getCreatorIconPathForModelId(effectiveModelId)
    : null;

  const handleRowClick = useCallback(() => {
    if (selectMode) {
      // Only downloadable (completed, URL-bearing) items are selectable.
      if (item.fullImage) onToggleSelect?.(item);
      return;
    }
    onClick(item);
  }, [item, onClick, selectMode, onToggleSelect]);
  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleRowClick();
      }
    },
    [handleRowClick],
  );

  const timeAgo = formatTimeAgo(item.createdAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      className={`group flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 ${selected ? "bg-primary-400/10" : ""}`}
    >
      {/* Selection checkbox (select mode only) */}
      {selectMode && (
        <div
          className={`pointer-events-none flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
            selected
              ? "border-primary-400 bg-primary-400 text-white"
              : "border-white/60 bg-black/40 text-transparent"
          } ${item.fullImage ? "" : "invisible"}`}
        >
          <CheckIcon  className="text-[10px]" />
        </div>
      )}

      {/* Thumbnail */}
      <div className={`relative size-[100px] shrink-0 overflow-hidden rounded-md bg-ui-controls/40 leading-none ${lastViewed ? "ring-2 ring-primary-400/50" : ""}`}>
        <GalleryThumbnail
          thumbnail={item.thumbnail}
          stillThumbnail={item.stillThumbnail}
          alt={item.label}
          isVideo={isVideo}
          fallbackIcon={mediaIcon}
          fallbackIconClassName="text-base text-white/20"
          showRetryLabel={false}
        />
        {isVideo && item.thumbnail && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
              <PlayIcon
                
                className="ml-0.5 text-[9px] text-white/90" />
            </span>
          </div>
        )}
        {/* Persistent "Last viewed" badge (stays until another item is
            opened in the lightbox). */}
        {lastViewed && (
          <div className="pointer-events-none absolute left-1 top-1 z-10 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/80">
            Last viewed
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
        {isAudio && item.fullImage && (
          <div className="mt-1.5 max-w-md rounded-md bg-white/[0.04]">
            <WaveformAudioPlayer
              src={item.fullImage}
              durationMillis={item.durationMillis}
              compact
            />
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
          {actionsSlot && !selectMode && (
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
