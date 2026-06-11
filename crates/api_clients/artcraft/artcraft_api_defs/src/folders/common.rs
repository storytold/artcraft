use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use url::Url;
use utoipa::ToSchema;

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

// NB: The "folder media file" list-item shape lives in storyteller_web
// (see `endpoints/folders/media_files/list_folder_media_files_handler.rs`)
// because it embeds `MediaFileCoverImageDetails` and other domain types
// that depend on the request's `MediaDomain` + `ServerEnvironment`.

/// Canonical wire shape for a folder. Used by single-folder GETs, create
/// responses, list rows, and subfolder list rows.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct FolderInfo {
  pub token: FolderToken,
  pub name: String,
  pub owner_user_token: UserToken,
  pub maybe_parent_folder_token: Option<FolderToken>,

  /// The four most-recent media files added to the folder, in slot order
  /// (the schema stores them as `maybe_last_media_file_token_1..4`).
  /// Slots whose media file has been deleted are skipped, so the vec
  /// may contain 0-4 entries.
  pub last_media_thumbnails: Vec<FolderThumbnail>,

  /// User-chosen cover image. When present, the frontend should use this
  /// as the folder's primary thumbnail instead of the
  /// `last_media_thumbnails` grid.
  pub maybe_custom_cover_thumbnail: Option<FolderThumbnail>,

  pub maybe_color_code: Option<String>,
  pub has_star: bool,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  /// True when `maybe_parent_folder_token` is set but the referenced
  /// parent row is missing or soft-deleted.
  pub is_orphaned: bool,
}

/// A compact thumbnail descriptor for a media file referenced by a
/// folder (either one of the `last_media_*` slots or the custom cover).
///
/// Intentionally narrower than `MediaLinks` / `CoverImageLinks` — folders
/// only need the bare minimum to render a thumbnail card. The CDN URL is
/// the direct asset link; `maybe_thumbnail_template` carries the resizing
/// template URL (with `{{width}}` / `{{height}}` placeholders) when the
/// media class supports it.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct FolderThumbnail {
  pub token: MediaFileToken,
  pub media_class: MediaFileClass,
  pub media_type: MediaFileType,

  /// Direct CDN URL to the underlying media asset.
  pub cdn_url: Url,

  /// Resizing template URL (with `{{width}}` / `{{height}}` placeholders)
  /// when the media class supports it. `None` for media classes without
  /// a thumbnail variant. (Video media files instead have video previews,
  /// which, in turn, have their own thumbnail templates.)
  pub maybe_thumbnail_template: Option<String>,

  /// Video preview images (still and animated gif) for mp4 video files.
  /// These are only set for video media files.
  pub maybe_video_previews: Option<FolderThumbnailVideoPreviews>,
}

/// Video preview images for a video media file referenced by a folder.
/// Mirrors the shape of `MediaLinks`' video previews, but is its own type
/// so the folder wire shape can evolve independently.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct FolderThumbnailVideoPreviews {
  /// A static single frame preview image of the video.
  pub still: Url,

  /// An animated gif preview of the video.
  pub animated: Url,

  /// A template used to construct the still thumbnail URL.
  /// Replace the string `{WIDTH}` with the desired width.
  pub still_thumbnail_template: String,

  /// A template used to construct the animated thumbnail URL.
  /// Replace the string `{WIDTH}` with the desired width.
  pub animated_thumbnail_template: String,
}
