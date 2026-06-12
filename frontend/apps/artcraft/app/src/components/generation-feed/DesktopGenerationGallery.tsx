import { useCallback, useState } from "react";
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
import { toast } from "@storyteller/ui-toaster";
import {
  GenerationListView,
  GenerationGridView,
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
}

export function DesktopGenerationGallery({
  enableMakeVideo,
  ...feedProps
}: DesktopGenerationGalleryProps) {
  const viewMode = useGalleryViewStore((s) => s.viewMode);

  const handleCopyResult = useCallback((success: boolean) => {
    if (success) {
      toast.success("Prompt copied");
    } else {
      toast.error("Unable to copy prompt");
    }
  }, []);

  if (viewMode === "list") {
    return (
      <GenerationListView
        {...feedProps}
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
    );
  }

  return (
    <div className="px-3">
      <GenerationGridView
        {...feedProps}
        renderGalleryActions={(item, ctx) => (
          <ItemActions
            item={item}
            promptToken={ctx.promptToken ?? item.promptToken}
            enableMakeVideo={enableMakeVideo}
            variant="card"
          />
        )}
      />
    </div>
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
  const recreateMediaClass: "image" | "video" | null = isVideo
    ? "video"
    : is3D
      ? null
      : "image";
  const canRecreate = !!promptToken && !!recreateMediaClass;
  const canMakeVideo = !!enableMakeVideo && !isVideo && !is3D;

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
      {item.fullImage && (
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
