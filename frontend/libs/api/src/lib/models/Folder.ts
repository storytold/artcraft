/**
 * Rich CDN links for a media file (full asset URL, resize template, and
 * animated video preview when applicable). Shared by the folder media-file
 * list items. The `maybe_thumbnail_template` carries `{WIDTH}`/`{HEIGHT}`
 * placeholders for `getThumbnailUrl`.
 */
export interface MediaLinks {
  cdn_url: string;
  maybe_thumbnail_template?: string | null;
  maybe_video_previews?: {
    animated?: string | null;
    cdn_url?: string | null;
    maybe_thumbnail_template?: string | null;
  } | null;
}

/**
 * Cover-image details for a media file. For files without their own cover the
 * backend still returns a deterministic default-cover spec the UI uses for
 * placeholders.
 */
export interface MediaFileCoverImageDetails {
  maybe_cover_image_public_bucket_url?: string | null;
  maybe_cover_image_public_bucket_path?: string | null;
  default_cover?: {
    image_index: number;
    color_index: number;
  };
}

/**
 * A compact thumbnail descriptor for a media file referenced by a folder
 * (one of the `last_media_*` slots or the custom cover). `cdn_url` is the
 * direct asset link; `maybe_thumbnail_template` is the resize template
 * (`{WIDTH}`/`{HEIGHT}`) when the media class supports it.
 */
export interface FolderThumbnail {
  token: string;
  media_class: string;
  media_type: string;
  cdn_url: string;
  maybe_thumbnail_template?: string | null;
}

/**
 * Canonical wire shape for a folder — used by single-folder GETs, create
 * responses, the `list_all` rows, and subfolder list rows. Folders nest via
 * `maybe_parent_folder_token` (null = root).
 */
export interface FolderInfo {
  token: string;
  name: string;
  owner_user_token: string;
  /** Parent folder token, or null for a root-level folder. */
  maybe_parent_folder_token?: string | null;
  /**
   * The (up to four) most-recent media files in the folder, slot order.
   * Deleted slots are skipped, so 0–4 entries. Used for an auto cover collage.
   */
  last_media_thumbnails: FolderThumbnail[];
  /** User-chosen cover image — when present, use it as the primary thumbnail. */
  maybe_custom_cover_thumbnail?: FolderThumbnail | null;
  /** Hex code, named color, or any string the user picked. Theme-aware UI. */
  maybe_color_code?: string | null;
  has_star: boolean;
  /** True when the parent pointer is set but the referenced parent is missing/soft-deleted. */
  is_orphaned: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * One media file as it appears inside a folder. Carries rich `media_links`
 * (and cover details), so callers can render thumbnails directly without a
 * second batch-get round trip.
 */
export interface FolderMediaFileListItem {
  token: string;
  media_class: string;
  media_type: string;
  maybe_prompt_token?: string | null;
  maybe_batch_token?: string | null;
  media_links: MediaLinks;
  cover_image?: MediaFileCoverImageDetails;
  maybe_title?: string | null;
  maybe_original_filename?: string | null;
  maybe_frame_width?: number | null;
  maybe_frame_height?: number | null;
  maybe_duration_millis?: number | null;
  creator_set_visibility?: string;
  is_user_upload?: boolean;
  is_intermediate_system_file?: boolean;
  created_at: string;
  updated_at: string;
  /** When the media file was added to the folder. */
  added_to_folder_at: string;
}
