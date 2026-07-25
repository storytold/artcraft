import type { NavigateFunction } from "react-router-dom";
import type { GalleryItem } from "@storyteller/ui-gallery-modal";
import { toast } from "../components/toast/toast";
import type { RefImage } from "../components/prompt-box/types";
import { useCreateImageStore } from "../pages/create-image/create-image-store";
import { useCreateVideoStore } from "../pages/create-video/create-video-store";

export type PromptDestination = "image" | "video";

const DESTINATION_ROUTES: Record<PromptDestination, string> = {
  image: "/create-image",
  video: "/create-video",
};

export function isImagePromptable(item: GalleryItem): boolean {
  return item.mediaClass === "image" && !!(item.thumbnail || item.fullImage);
}

// Parks library images for a create page's reference deck and navigates
// there. The reference cap is per-model and only known on the receiving page,
// so the images travel via the store's `pendingRefImages` slot and the page
// merges them (dedupe + real cap) once its model list is loaded.
export function sendToPrompt(
  items: GalleryItem[],
  destination: PromptDestination,
  navigate: NavigateFunction,
): void {
  const images = items.filter(isImagePromptable);
  if (images.length === 0) {
    toast.error("Select at least one image to use as a reference");
    return;
  }
  const refs = images.map(galleryItemToRefImage);
  if (destination === "image") {
    useCreateImageStore.getState().setPendingRefImages(refs);
  } else {
    useCreateVideoStore.getState().setPendingRefImages(refs);
  }
  navigate(DESTINATION_ROUTES[destination]);
}

export function galleryItemToRefImage(item: GalleryItem): RefImage {
  return {
    id: crypto.randomUUID(),
    url: item.thumbnail || item.fullImage || "",
    fullUrl: item.fullImage || undefined,
    file: new File([], "library-image"),
    mediaToken: item.id,
  };
}

// ── Merge (used by the receiving create pages) ─────────────────────────────

export interface MergeRefImagesResult {
  next: RefImage[];
  added: number;
  // Incoming refs whose media token was already attached.
  duplicates: number;
  // Fresh refs that didn't fit under the model's cap.
  overflow: number;
}

// Merges incoming reference images into an existing deck: skips refs whose
// media token is already attached, then clamps to the model's cap.
export function mergeRefImages(
  existing: RefImage[],
  incoming: RefImage[],
  maxRefs: number,
): MergeRefImagesResult {
  const existingTokens = new Set(
    existing.map((ref) => ref.mediaToken).filter(Boolean),
  );
  const fresh = incoming.filter(
    (ref) => !ref.mediaToken || !existingTokens.has(ref.mediaToken),
  );
  const slots = Math.max(0, maxRefs - existing.length);
  const added = fresh.slice(0, slots);
  return {
    next: [...existing, ...added],
    added: added.length,
    duplicates: incoming.length - fresh.length,
    overflow: fresh.length - added.length,
  };
}

// Feedback for a merge. Silent when everything landed or the only skips were
// images already attached (either way, everything selected is now in the
// deck); otherwise say what was left out and why.
export function toastMergeRefImagesOutcome(
  result: MergeRefImagesResult,
  maxRefs: number,
): void {
  if (result.overflow === 0) return;
  if (result.added > 0) {
    const sent = result.added + result.overflow;
    toast.success(
      `Added ${result.added} of ${sent} images — this model takes up to ${maxRefs} references`,
    );
  } else if (maxRefs === 0) {
    toast.error("The selected model doesn't take image references");
  } else {
    toast.error(
      `Couldn't add more images — this model's reference limit (${maxRefs}) is reached`,
    );
  }
}
