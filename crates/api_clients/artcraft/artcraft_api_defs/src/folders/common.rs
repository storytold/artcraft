use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

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

