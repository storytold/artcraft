import type {
  FolderMediaFileListItem,
  TagMediaFileListItem,
} from "@storyteller/api";
import type { GalleryItem } from "@storyteller/ui-gallery-modal";
import { getMediaThumbnail, THUMBNAIL_SIZES } from "@storyteller/common";
import { is3DMediaClass } from "@storyteller/ui-generation-list";

// Media-row → GalleryItem mappers shared by the library page and its folder /
// tag stores (kept out of the stores so they can't import each other).

/** Rows from the lean folder- and tag-scoped media listings (same wire shape). */
type LeanMediaListItem = FolderMediaFileListItem | TagMediaFileListItem;

const getLabel = (item: any): string => {
  if (item.maybe_title) return item.maybe_title;
  switch (item.media_class) {
    case "image":
      return "Image Generation";
    case "video":
      return "Video Generation";
    case "dimensional":
    case "mesh":
      return "3D Mesh";
    case "splat":
      return "3D World";
    default:
      return "Generation";
  }
};

/** Map a raw user-media list row (origin_category shape) → GalleryItem (root library). */
export function mapRawToGalleryItem(item: any): GalleryItem {
  const thumbnail = is3DMediaClass(item.media_class)
    ? (item.cover_image?.maybe_cover_image_public_bucket_url ?? null)
    : getMediaThumbnail(item.media_links, item.media_class, {
        size: THUMBNAIL_SIZES.LARGE,
      });
  return {
    id: item.token,
    label: getLabel(item),
    thumbnail,
    thumbnailUrlTemplate: item.media_links?.maybe_thumbnail_template,
    fullImage: item.media_links?.cdn_url ?? null,
    createdAt: item.created_at,
    mediaClass: item.media_class || "image",
    // The user-media list carries `origin_category`; the folderless list
    // carries `is_user_upload` instead.
    isUpload: item.origin_category === "upload" || item.is_user_upload === true,
    batchImageToken: item.maybe_batch_token,
  };
}

/** Map a lean folder/tag list row → GalleryItem (carries media_links inline). */
export function mapLeanListItemToGalleryItem(
  item: LeanMediaListItem,
): GalleryItem {
  const thumbnail = is3DMediaClass(item.media_class)
    ? (item.cover_image?.maybe_cover_image_public_bucket_url ?? null)
    : getMediaThumbnail(item.media_links, item.media_class, {
        size: THUMBNAIL_SIZES.LARGE,
      });
  return {
    id: item.token,
    label: getLabel(item),
    thumbnail,
    thumbnailUrlTemplate: item.media_links?.maybe_thumbnail_template ?? undefined,
    fullImage: item.media_links?.cdn_url ?? null,
    createdAt: item.created_at,
    mediaClass: item.media_class || "image",
    isUpload: !!item.is_user_upload,
    batchImageToken: item.maybe_batch_token ?? undefined,
  };
}

export const errMsg = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);
