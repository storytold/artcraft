import { ArrowDownToLineIcon, CheckIcon, LinkIcon, LoaderCircleIcon, RotateCwIcon, VideoIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  GenerationListView,
  type GalleryItem,
  is3DMediaClass,
  type RecreateSlotContext,
  useGallerySelectionStore,
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
  selectable,
}: GenerationGalleryProps) {
  const selectionActive = useGallerySelectionStore((s) => s.active);
  const selectedIds = useGallerySelectionStore((s) => s.ids);
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
      selectionMode={!!selectable && selectionActive}
      selectedIds={selectedIds}
      onToggleSelect={handleToggleSelect}
    />
  );
}

function handleToggleSelect(item: GalleryItem) {
  useGallerySelectionStore.getState().toggle(item.id);
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
  // Recreate only targets the image/video create pages; 3D generations have no
  // recreate flow, so map to a valid class for the hook and render nothing.
  const { isRecreating, handleRecreate } = useRecreateFromPromptToken(
    promptToken,
    is3DMediaClass(mediaClass) ? "image" : mediaClass,
  );

  if (is3DMediaClass(mediaClass)) return null;
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
        <DynamicIcon
          icon={isRecreating ? LoaderCircleIcon : RotateCwIcon}
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
            onClick={handleMakeVideo}
            aria-label="Make Video"
            className={buttonClass}
          >
            <VideoIcon  className="text-sm" />
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
          <DynamicIcon
            icon={shareCopied ? CheckIcon : LinkIcon}
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
