import { memo, useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownToLine,
  faArrowRotateRight,
  faCheck,
  faCopy,
  faLink,
  faPlay,
  faSpinnerThird,
  faVideo,
} from "@fortawesome/pro-solid-svg-icons";
import { Tooltip } from "@storyteller/ui-tooltip";
import { GalleryThumbnail } from "./GalleryThumbnail";
import {
  useGalleryItemActions,
  type GalleryItemActions,
} from "./useGalleryItemActions";
import { toast } from "../toast/toast";
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
  // The prompt record is still resolving — show a skeleton in place of the title.
  loading?: boolean;
}

export const GalleryRow = memo(function GalleryRow({
  item,
  onClick,
  enableMakeVideo = false,
  title,
  modelId,
  loading = false,
}: GalleryRowProps) {
  const actions = useGalleryItemActions(item, { enableMakeVideo, modelId });
  const { isVideo, mediaIcon, mediaLabel, modelDisplayName, modelIconPath } =
    actions;

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
            {title && <CopyPromptButton text={title} />}
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
          <div className="flex shrink-0 items-center gap-0.5 sm:ms-1.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <GalleryRowActions
              actions={actions}
              hasDownload={!!item.fullImage}
            />
          </div>
          <span className="ml-auto shrink-0 whitespace-nowrap text-white/40">
            {timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
});

// Copies the resolved prompt to the clipboard, with copy→check feedback. Sits
// at the right of the prompt line; only rendered when a real prompt exists.
function CopyPromptButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Prompt copied");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        toast.error("Unable to copy prompt");
      }
    },
    [text],
  );

  return (
    <Tooltip content={copied ? "Copied" : "Copy prompt"} position="top">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy prompt"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white"
      >
        <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-sm" />
      </button>
    </Tooltip>
  );
}

// Recreate / make-video / share / download buttons, shared by the desktop
// (hover) and mobile (inline) clusters. Each handler stops propagation so taps
// don't also open the lightbox.
function GalleryRowActions({
  actions,
  hasDownload,
}: {
  actions: GalleryItemActions;
  hasDownload: boolean;
}) {
  const {
    recreateMediaClass,
    canMakeVideo,
    isRecreating,
    isDownloading,
    shareCopied,
    handleRecreate,
    handleMakeVideo,
    handleShare,
    handleDownload,
  } = actions;

  const buttonClass =
    "flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60";

  return (
    <>
      {recreateMediaClass && (
        <Tooltip content="Recreate" position="top">
          <button
            type="button"
            onClick={handleRecreate}
            disabled={isRecreating}
            aria-label="Recreate"
            className={buttonClass}
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
            className={buttonClass}
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
          className={buttonClass}
        >
          <FontAwesomeIcon
            icon={shareCopied ? faCheck : faLink}
            className="text-sm"
          />
        </button>
      </Tooltip>
      {hasDownload && (
        <Tooltip content="Download" position="top">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            aria-label="Download"
            className={buttonClass}
          >
            <FontAwesomeIcon
              icon={isDownloading ? faSpinnerThird : faArrowDownToLine}
              className={`text-sm ${isDownloading ? "animate-spin" : ""}`}
            />
          </button>
        </Tooltip>
      )}
    </>
  );
}
