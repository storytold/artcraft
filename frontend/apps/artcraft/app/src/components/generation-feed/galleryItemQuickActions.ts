import { isLocalGeneration } from "@storyteller/tauri-api";
import type { GalleryItem } from "@storyteller/ui-generation-list";

export interface GalleryItemQuickActions {
  /** The create page recreate re-seeds, or null when recreate isn't offered. */
  recreateMediaClass: "image" | "video" | null;
  makeVideo: boolean;
  share: boolean;
  download: boolean;
}

/**
 * Which quick actions a completed feed item offers. Images kept on this computer have no library
 * media token, so recreate, make-video and share can't work for them; they can still be downloaded.
 */
export function galleryItemQuickActions(
  item: GalleryItem,
  { promptToken, enableMakeVideo }: { promptToken?: string; enableMakeVideo?: boolean },
): GalleryItemQuickActions {
  const inLibrary = !isLocalGeneration(item.id);
  const isVideo = item.mediaClass === "video";
  const is3D = item.mediaClass === "dimensional";
  const isAudio = item.mediaClass === "audio";
  // Audio v1: no recreate / make-video — share + download only.
  const recreateMediaClass = isVideo ? "video" : is3D || isAudio ? null : "image";
  return {
    recreateMediaClass: inLibrary && promptToken ? recreateMediaClass : null,
    makeVideo: inLibrary && !!enableMakeVideo && !isVideo && !is3D && !isAudio,
    share: inLibrary,
    download: !!item.fullImage,
  };
}
