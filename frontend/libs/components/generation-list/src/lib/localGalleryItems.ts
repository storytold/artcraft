import type { GalleryItem } from "./types";

// An image kept on this computer (made without an ArtCraft account): the shape the desktop app's
// `ListLocalGenerations` returns.
export interface LocalGenerationLike {
  id: string;
  url: string;
  prompt: string;
  model_id: string;
  created_at: string;
}

export function localGenerationsToGalleryItems(images: LocalGenerationLike[]): GalleryItem[] {
  return images.map((image) => ({
    id: image.id,
    label: image.prompt || "Image Generation",
    thumbnail: image.url,
    fullImage: image.url,
    createdAt: image.created_at,
    mediaClass: "image",
    modelId: image.model_id || undefined,
  }));
}

export interface MergeLocalGalleryItemsOptions {
  // False while `remote` is only the first pages of a longer list. Local items older than the
  // oldest loaded remote item are then held back, so they don't sit at the bottom of the window
  // and jump each time another page loads. Defaults to true.
  remoteComplete?: boolean;
}

/** `remote` plus the `local` items it doesn't already have, newest first. */
export function mergeLocalGalleryItems<T extends { id: string; createdAt: string }>(
  remote: T[],
  local: T[] | undefined,
  options: MergeLocalGalleryItemsOptions = {},
): T[] {
  if (!local || local.length === 0) return remote;
  const ids = new Set(remote.map((item) => item.id));
  const cutoff = options.remoteComplete === false && remote.length > 0
    ? Math.min(...remote.map((item) => timeOf(item)))
    : -Infinity;
  const extra = local.filter((item) => !ids.has(item.id) && timeOf(item) >= cutoff);
  return [...remote, ...extra].sort((a, b) => timeOf(b) - timeOf(a));
}

function timeOf(item: { createdAt: string }): number {
  return new Date(item.createdAt).getTime();
}
