import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownToLine,
  faArrowRotateRight,
  faCheck,
  faLink,
  faSpinnerThird,
  faVideo,
} from "@fortawesome/pro-solid-svg-icons";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  GenerationGridView,
  type GalleryItem,
  type RecreateSlotContext,
} from "@storyteller/ui-generation-list";
import { useRecreateFromPromptToken } from "../../lib/recreate";
import { useGalleryItemActions } from "./useGalleryItemActions";
import type { GenerationGalleryProps } from "./types";

// Thin wrapper over the shared masonry grid: injects the webapp-only
// affordances (recreate navigation, share/download actions) through the
// view's render-prop seams. Layout and card markup live in
// @storyteller/ui-generation-list and are shared with the desktop app.

export function GenerationGalleryGrid({
  inProgressJobs,
  failedJobs,
  onDismissFailed,
  newlyCompletedItems,
  galleryItems,
  newlyCompletedTokens,
  hasMore,
  isLoading,
  isInitialLoading,
  onLoadMore,
  onGalleryItemClick,
  enableMakeVideo,
}: GenerationGalleryProps) {
  return (
    <GenerationGridView
      inProgressJobs={inProgressJobs}
      failedJobs={failedJobs}
      onDismissFailed={onDismissFailed}
      newlyCompletedItems={newlyCompletedItems}
      galleryItems={galleryItems}
      newlyCompletedTokens={newlyCompletedTokens}
      hasMore={hasMore}
      isLoading={isLoading}
      isInitialLoading={isInitialLoading}
      onLoadMore={onLoadMore}
      onGalleryItemClick={onGalleryItemClick}
      renderRecreate={(ctx) => <CardRecreateButton {...ctx} />}
      renderGalleryActions={(item) => (
        <CardActions item={item} enableMakeVideo={enableMakeVideo} />
      )}
    />
  );
}

// Recreate affordance for pending + failed cards. The pending card shows a
// hover-revealed icon button by the prompt; the failed card a labeled button
// next to Dismiss.
function CardRecreateButton({
  promptToken,
  mediaClass,
  kind,
}: RecreateSlotContext) {
  const { isRecreating, handleRecreate } = useRecreateFromPromptToken(
    promptToken,
    mediaClass,
  );

  if (kind === "failed") {
    return (
      <button
        type="button"
        onClick={handleRecreate}
        disabled={isRecreating}
        className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
      >
        <FontAwesomeIcon
          icon={isRecreating ? faSpinnerThird : faArrowRotateRight}
          className={isRecreating ? "animate-spin" : ""}
        />
        Recreate
      </button>
    );
  }

  return (
    <Tooltip content="Recreate" position="top">
      <button
        type="button"
        onClick={handleRecreate}
        disabled={isRecreating}
        aria-label="Recreate"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/70 opacity-0 transition hover:bg-white/15 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-60"
      >
        <FontAwesomeIcon
          icon={isRecreating ? faSpinnerThird : faArrowRotateRight}
          className={`text-sm ${isRecreating ? "animate-spin" : ""}`}
        />
      </button>
    </Tooltip>
  );
}

// Hover quick actions for completed cards (recreate / make-video / share /
// download), styled for the card's dark action pill.
function CardActions({
  item,
  enableMakeVideo,
}: {
  item: GalleryItem;
  enableMakeVideo?: boolean;
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
  } = useGalleryItemActions(item, { enableMakeVideo });

  const buttonClass =
    "flex h-7 w-7 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-60";

  return (
    <>
      {recreateMediaClass && (
        <Tooltip content="Recreate" position="top">
          <button
            type="button"
            className={buttonClass}
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
      {canMakeVideo && (
        <Tooltip content="Make Video" position="top">
          <button
            type="button"
            className={buttonClass}
            onClick={handleMakeVideo}
            aria-label="Make Video"
          >
            <FontAwesomeIcon icon={faVideo} className="text-sm" />
          </button>
        </Tooltip>
      )}
      <Tooltip content={shareCopied ? "Copied" : "Share"} position="top">
        <button
          type="button"
          className={buttonClass}
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
            className={buttonClass}
            aria-label="Download"
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
