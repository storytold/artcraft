/**
 * Canonical wire shape for a folder — used by single-folder GETs, create
 * responses, the `list_all` rows, and subfolder list rows. Folders nest via
 * `maybe_parent_folder_token` (null = root).
 */
export interface Folder {
  token: string;
  name: string;
  owner_user_token: string;
  has_star: boolean;
  /** True when the parent pointer is set but the referenced parent is missing/soft-deleted. */
  is_orphaned: boolean;
  /** Parent folder token, or null for a root-level folder. */
  maybe_parent_folder_token?: string | null;
  /** Hex code, named color, or any string the user picked. Theme-aware UI. */
  maybe_color_code?: string | null;
  /** Media-file token of the custom cover image set on the folder. */
  maybe_cover_image_custom_media_token?: string | null;
  /** Up to four most-recent member media-file tokens, for an auto cover collage. */
  maybe_last_media_file_token_1?: string | null;
  maybe_last_media_file_token_2?: string | null;
  maybe_last_media_file_token_3?: string | null;
  maybe_last_media_file_token_4?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Lean wire shape for a media file as listed inside a folder. Enough to render
 * a thumbnail; callers needing richer fields should hit the media-file
 * batch-get endpoint.
 */
export interface FolderMediaFile {
  media_file_token: string;
  media_class: string;
  media_type: string;
  public_bucket_directory_hash: string;
  added_to_folder_at: string;
  maybe_title?: string | null;
  maybe_mime_type?: string | null;
  maybe_public_bucket_prefix?: string | null;
  maybe_public_bucket_extension?: string | null;
  maybe_frame_width?: number | null;
  maybe_frame_height?: number | null;
  maybe_duration_millis?: number | null;
}
