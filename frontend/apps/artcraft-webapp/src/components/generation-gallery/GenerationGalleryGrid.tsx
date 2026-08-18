import { ArrowDownToLineIcon, CheckIcon, LinkIcon, LoaderCircleIcon, RotateCwIcon, VideoIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  GenerationGridView,
  type GalleryItem,
  type RecreateSlotContext,
  useGallerySelectionStore,
  useLastViewedGenerationStore,
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
  selectable,
}: GenerationGalleryProps) {
  const selectionActive = useGallerySelectionStore((s) => s.active);
  const selectedIds = useGallerySelectionStore((s) => s.ids);
  const lastViewedId = useLastViewedGenerationStore((s) => s.id);
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
      selectionMode={!!selectable && selectionActive}
      selectedIds={selectedIds}
      onToggleSelect={handleToggleSelect}
      lastViewedId={lastViewedId}
    />
  );
}

function handleToggleSelect(item: GalleryItem) {
  useGallerySelectionStore.getState().toggle(item.id);
}

// Recreate affordance for pending + failed cards. The pending card shows a
// hover-revealed icon button by the prompt; the failed card a labeled button
// next to Dismiss.
function CardRecreateButton({
  promptToken,
  mediaClass,
  kind,
}: RecreateSlotContext) {
  // Recreate only targets the image/video create pages; 3D and audio
  // generations have no recreate flow, so map to a valid class for the hook
  // (it must run unconditionally) and render nothing.
  const hasRecreateFlow = mediaClass === "image" || mediaClass === "video";
  const { isRecreating, handleRecreate } = useRecreateFromPromptToken(
    promptToken,
    hasRecreateFlow ? mediaClass : "image",
  );

  if (!hasRecreateFlow) return null;

  if (kind === "failed") {
    return (
      <button
        type="button"
        onClick={handleRecreate}
        disabled={isRecreating}
        className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
      >
        <DynamicIcon
          icon={isRecreating ? LoaderCircleIcon : RotateCwIcon}
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
        <DynamicIcon
          icon={isRecreating ? LoaderCircleIcon : RotateCwIcon}
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
            <DynamicIcon
              icon={isRecreating ? LoaderCircleIcon : RotateCwIcon}
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
            <VideoIcon  className="text-sm" />
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
          <DynamicIcon
            icon={shareCopied ? CheckIcon : LinkIcon}
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
            <DynamicIcon
              icon={isDownloading ? LoaderCircleIcon : ArrowDownToLineIcon}
              className={`text-sm ${isDownloading ? "animate-spin" : ""}`}
            />
          </button>
        </Tooltip>
      )}
    </>
  );
}
