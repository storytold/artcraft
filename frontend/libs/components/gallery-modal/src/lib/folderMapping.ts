import type { FolderInfo } from "@storyteller/api";
import { getThumbnailUrl, THUMBNAIL_SIZES } from "@storyteller/common";
import type { GalleryFolder } from "./GalleryDraggableItem";
import type { GalleryItem } from "./gallery-modal";
import { resolveFolderThumb } from "./folderUtils";

/**
 * The single API-folder → UI-folder mapper, shared by the desktop modal and the
 * webapp store (both `GalleryFolder` and the webapp's `UiFolder` are satisfied
 * by this shape; `parentId` is normalized to `string | null`). Orphaned folders
 * (parent soft-deleted) surface at root so they stay reachable.
 */
export const mapFolderInfo = (f: FolderInfo): GalleryFolder => ({
  id: f.token,
  name: f.name,
  parentId: f.is_orphaned ? null : (f.maybe_parent_folder_token ?? null),
  hasStar: f.has_star,
  colorCode: f.maybe_color_code ?? null,
  // LARGE (512px): cover is full-bleed and collage cells render large enough
  // (esp. on retina / low column counts) that smaller sizes look blurry.
  coverUrl: resolveFolderThumb(
    f.maybe_custom_cover_thumbnail,
    THUMBNAIL_SIZES.LARGE,
  ),
  collageUrls: (f.last_media_thumbnails ?? [])
    .slice(0, 4)
    .map((t) => resolveFolderThumb(t, THUMBNAIL_SIZES.LARGE))
    .filter((u): u is string => !!u),
});

/**
 * Still thumbnail url for a folder cover/collage tile (an `<img>`), derived from
 * an already-resolved `GalleryItem`. Prefers the still resize template; for video
 * `item.thumbnail` holds the animated gif (fine in an `<img>`); never the raw
 * video file. Used for the optimistic cover update on add/move.
 */
export const galleryItemToCollageUrl = (item: GalleryItem): string | null =>
  getThumbnailUrl(item.thumbnailUrlTemplate, {
    width: THUMBNAIL_SIZES.LARGE,
  }) ??
  item.thumbnail ??
  null;

/** Prepend new collage urls (dropping nulls), dedupe against existing, cap to `cap`. */
export const mergeCollageUrls = (
  existing: string[] | undefined,
  newUrls: (string | null)[],
  cap = 4,
): string[] => {
  const fresh = newUrls.filter((u): u is string => !!u);
  const seen = new Set(fresh);
  const merged = [...fresh];
  for (const u of existing ?? []) {
    if (!seen.has(u)) {
      seen.add(u);
      merged.push(u);
    }
  }
  return merged.slice(0, cap);
};
