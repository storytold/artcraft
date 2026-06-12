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
  GenerationListView,
  type GalleryItem,
  type RecreateSlotContext,
} from "@storyteller/ui-generation-list";
import { toast } from "../toast/toast";
import { useRecreateFromPromptToken } from "../../lib/recreate";
import {
  useGalleryItemActions,
  type GalleryItemActions,
} from "./useGalleryItemActions";
import type { GenerationGalleryProps } from "./types";

// Thin wrapper over the shared list view: injects the webapp-only affordances
// (recreate navigation, share/download actions, toasts) through the view's
// render-prop seams. Layout and row markup live in
// @storyteller/ui-generation-list and are shared with the desktop app.

export function GenerationGalleryList({
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
    <GenerationListView
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
      renderRecreate={(ctx) => <RowRecreateButton {...ctx} />}
      renderGalleryActions={(item, { modelId }) => (
        <GalleryRowHoverActions
          item={item}
          modelId={modelId}
          enableMakeVideo={enableMakeVideo}
        />
      )}
      onCopyPromptResult={handleCopyResult}
    />
  );
}

function handleCopyResult(success: boolean) {
  if (success) {
    toast.success("Prompt copied");
  } else {
    toast.error("Unable to copy prompt");
  }
}

// Recreate button for pending + failed rows. Pending rows render it inside the
// lib's hover-revealed cluster; failed rows show it inline (dimmer tint).
function RowRecreateButton({
  promptToken,
  mediaClass,
  kind,
}: RecreateSlotContext) {
  const { isRecreating, handleRecreate } = useRecreateFromPromptToken(
    promptToken,
    mediaClass,
  );
  return (
    <Tooltip content="Recreate" position="top">
      <button
        type="button"
        onClick={handleRecreate}
        disabled={isRecreating}
        aria-label="Recreate"
        className={
          kind === "pending"
            ? "flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
            : "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
        }
      >
        <FontAwesomeIcon
          icon={isRecreating ? faSpinnerThird : faArrowRotateRight}
          className={`text-sm ${isRecreating ? "animate-spin" : ""}`}
        />
      </button>
    </Tooltip>
  );
}

function GalleryRowHoverActions({
  item,
  modelId,
  enableMakeVideo,
}: {
  item: GalleryItem;
  modelId?: string;
  enableMakeVideo?: boolean;
}) {
  const actions = useGalleryItemActions(item, { enableMakeVideo, modelId });
  return <GalleryRowActions actions={actions} hasDownload={!!item.fullImage} />;
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
