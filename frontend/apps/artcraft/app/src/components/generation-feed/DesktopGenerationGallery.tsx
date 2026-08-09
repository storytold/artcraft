import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownToLineIcon, CheckIcon, LinkIcon, LoaderCircleIcon, RotateCwIcon, VideoIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Tooltip } from "@storyteller/ui-tooltip";
import { toast } from "@storyteller/ui-toaster";
import {
  GenerationListView,
  GenerationGridView,
  SelectionActionBar,
  useGallerySelectionStore,
  useGalleryViewStore,
  type FailedJob,
  type GalleryItem,
  type InProgressJob,
} from "@storyteller/ui-generation-list";
import {
  applyMakeVideoFromImage,
  applyRecreateFromPromptToken,
  copyShareLink,
  downloadMediaFileToDisk,
  downloadMediaFilesToFolder,
} from "./desktopMediaActions";

// Desktop twin of the webapp's GenerationGallery: renders the shared feed in
// whichever layout the TopBar toggle picked (grid by default), injecting the
// desktop flavors of the quick actions (recreate / make-video / share /
// download) through the views' render-prop seams.

export interface DesktopGenerationGalleryProps {
  inProgressJobs: InProgressJob[];
  failedJobs: FailedJob[];
  onDismissFailed: (jobToken: string) => void;
  newlyCompletedItems: GalleryItem[];
  galleryItems: GalleryItem[];
  newlyCompletedTokens: Set<string>;
  hasMore: boolean;
  isLoading?: boolean;
  isInitialLoading: boolean;
  onLoadMore: () => void;
  onGalleryItemClick: (item: GalleryItem) => void;
  /** Image page only: show a "Make Video" quick action on image items. */
  enableMakeVideo?: boolean;
  /** Enables the multi-select + batch download flow (select toggle in the
   *  TopBar, checkboxes on completed items, floating download bar). */
  selectable?: boolean;
  /** Pixel offset that keeps the floating download bar above the page's
   *  fixed prompt box (pass the measured promptbox height + gap). */
  selectionBarBottomOffset?: number;
}

export function DesktopGenerationGallery({
  enableMakeVideo,
  selectable,
  selectionBarBottomOffset,
  ...feedProps
}: DesktopGenerationGalleryProps) {
  const viewMode = useGalleryViewStore((s) => s.viewMode);
  const selectionActive = useGallerySelectionStore((s) => s.active);
  const selectedIds = useGallerySelectionStore((s) => s.ids);

  // The selection store is global (like the view-mode store) — drop select
  // mode when the page unmounts (tab switch) so it can't leak elsewhere.
  useEffect(() => {
    if (!selectable) return;
    return () => useGallerySelectionStore.getState().setActive(false);
  }, [selectable]);

  const handleCopyResult = useCallback((success: boolean) => {
    if (success) {
      toast.success("Prompt copied");
    } else {
      toast.error("Unable to copy prompt");
    }
  }, []);

  const selectionProps = {
    selectionMode: !!selectable && selectionActive,
    selectedIds,
    onToggleSelect: handleToggleSelect,
  };
  const selectionBar = selectable && (
    <SelectionDownloadBar
      newlyCompletedItems={feedProps.newlyCompletedItems}
      galleryItems={feedProps.galleryItems}
      bottomOffset={selectionBarBottomOffset}
    />
  );

  if (viewMode === "list") {
    return (
      <>
        <GenerationListView
          {...feedProps}
          {...selectionProps}
          renderGalleryActions={(item, ctx) => (
            <ItemActions
              item={item}
              promptToken={ctx.promptToken ?? item.promptToken}
              enableMakeVideo={enableMakeVideo}
              variant="row"
            />
          )}
          onCopyPromptResult={handleCopyResult}
        />
        {selectionBar}
      </>
    );
  }

  return (
    <div className="px-3">
      <GenerationGridView
        {...feedProps}
        {...selectionProps}
        renderGalleryActions={(item, ctx) => (
          <ItemActions
            item={item}
            promptToken={ctx.promptToken ?? item.promptToken}
            enableMakeVideo={enableMakeVideo}
            variant="card"
          />
        )}
      />
      {selectionBar}
    </div>
  );
}

function handleToggleSelect(item: GalleryItem) {
  useGallerySelectionStore.getState().toggle(item.id);
}

// Floating bar shown in select mode: "Download" prompts for a folder and
// saves each selected item as its own file (native flow — no zip). Sits
// above the floating promptbox.
function SelectionDownloadBar({
  newlyCompletedItems,
  galleryItems,
  bottomOffset,
}: {
  newlyCompletedItems: GalleryItem[];
  galleryItems: GalleryItem[];
  bottomOffset?: number;
}) {
  const ids = useGallerySelectionStore((s) => s.ids);
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedItems = useMemo(() => {
    const byId = new Map(
      [...newlyCompletedItems, ...galleryItems].map(
        (it) => [it.id, it] as const,
      ),
    );
    return Array.from(ids)
      .map((id) => byId.get(id))
      .filter((it): it is GalleryItem => !!it?.fullImage);
  }, [newlyCompletedItems, galleryItems, ids]);

  const handleDownload = useCallback(async () => {
    if (isDownloading || selectedItems.length === 0) return;
    setIsDownloading(true);
    try {
      const anySaved = await downloadMediaFilesToFolder(selectedItems);
      if (anySaved) useGallerySelectionStore.getState().setActive(false);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, selectedItems]);

  return (
    // Sit above the fixed promptbox whatever its measured height is.
    <SelectionActionBar
      className={bottomOffset != null ? "" : "bottom-24"}
      style={bottomOffset != null ? { bottom: bottomOffset } : undefined}
    >
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading || selectedItems.length === 0}
        className="flex items-center gap-2 rounded-full bg-ui-controls/60 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ui-controls/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
      >
        <DynamicIcon
          icon={isDownloading ? LoaderCircleIcon : ArrowDownToLineIcon}
          className={`text-xs ${isDownloading ? "animate-spin" : ""}`}
        />
        Download
      </button>
    </SelectionActionBar>
  );
}

// Quick actions for a completed item — desktop equivalents of the webapp's
// useGalleryItemActions: recreate re-seeds the create page from the prompt
// record, make-video seeds the video page, share copies the public media
// link, download saves via Tauri. stopPropagation keeps taps from also
// opening the lightbox.
function ItemActions({
  item,
  promptToken,
  enableMakeVideo,
  variant,
}: {
  item: GalleryItem;
  promptToken?: string;
  enableMakeVideo?: boolean;
  variant: "row" | "card";
}) {
  const [isRecreating, setIsRecreating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const isVideo = item.mediaClass === "video";
  const is3D = item.mediaClass === "dimensional";
  const isAudio = item.mediaClass === "audio";
  // Audio v1: no recreate / make-video — share + download only.
  const recreateMediaClass: "image" | "video" | null = isVideo
    ? "video"
    : is3D || isAudio
      ? null
      : "image";
  const canRecreate = !!promptToken && !!recreateMediaClass;
  const canMakeVideo = !!enableMakeVideo && !isVideo && !is3D && !isAudio;

  const buttonClass =
    variant === "card"
      ? "flex h-7 w-7 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-60"
      : "flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60";

  const handleRecreate = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!promptToken || !recreateMediaClass || isRecreating) return;
      setIsRecreating(true);
      try {
        await applyRecreateFromPromptToken(promptToken, recreateMediaClass);
      } finally {
        setIsRecreating(false);
      }
    },
    [promptToken, recreateMediaClass, isRecreating],
  );

  const handleMakeVideo = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = item.fullImage || item.thumbnail;
      if (!url) return;
      applyMakeVideoFromImage(url, item.id);
    },
    [item.fullImage, item.thumbnail, item.id],
  );

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const ok = await copyShareLink(item.id);
      if (ok) {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
      }
    },
    [item.id],
  );

  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!item.fullImage || isDownloading) return;
      setIsDownloading(true);
      try {
        await downloadMediaFileToDisk(item.fullImage, item.mediaClass);
      } finally {
        setIsDownloading(false);
      }
    },
    [item.fullImage, item.mediaClass, isDownloading],
  );

  return (
    <>
      {canRecreate && (
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
      {item.fullImage && (
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
