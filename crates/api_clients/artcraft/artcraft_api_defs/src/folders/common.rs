use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

/// Canonical wire shape for a folder. Used by single-folder GETs, create
/// responses, list rows, and subfolder list rows.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct FolderInfo {
  pub token: FolderToken,
  pub name: String,
  pub owner_user_token: UserToken,
  pub maybe_parent_folder_token: Option<FolderToken>,

  pub maybe_last_media_file_token_1: Option<MediaFileToken>,
  pub maybe_last_media_file_token_2: Option<MediaFileToken>,
  pub maybe_last_media_file_token_3: Option<MediaFileToken>,
  pub maybe_last_media_file_token_4: Option<MediaFileToken>,

  pub maybe_cover_image_custom_media_token: Option<MediaFileToken>,

  pub maybe_color_code: Option<String>,
  pub has_star: bool,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  /// True when `maybe_parent_folder_token` is set but the referenced
  /// parent row is missing or soft-deleted.
  pub is_orphaned: bool,
}

/// Canonical wire shape for a media file inside a folder. Lean enough for
/// thumbnail rendering; callers that need richer fields should hit the
/// media-file batch-get endpoint.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct FolderMediaFileInfo {
  pub media_file_token: MediaFileToken,
  pub added_to_folder_at: DateTime<Utc>,

  pub media_type: String,
  pub media_class: String,
  pub maybe_mime_type: Option<String>,
  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,
  pub maybe_frame_width: Option<i32>,
  pub maybe_frame_height: Option<i32>,
  pub maybe_duration_millis: Option<i32>,
  pub maybe_title: Option<String>,
}
