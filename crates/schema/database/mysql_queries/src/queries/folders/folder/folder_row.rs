use chrono::{DateTime, Utc};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

/// Materialized representation of a `folders` row plus the derived
/// `is_orphaned` flag (true when `maybe_parent_folder_token` is set but the
/// referenced parent row is missing or soft-deleted).
#[derive(Debug, Clone)]
pub struct FolderRow {
  pub id: u64,
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
  pub is_orphaned: bool,
}
