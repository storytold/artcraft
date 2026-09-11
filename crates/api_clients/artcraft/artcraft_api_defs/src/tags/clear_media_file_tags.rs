use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

// ── POST /v1/tags/media_file/clear/{media_file_token} ──

#[derive(Deserialize, ToSchema)]
pub struct ClearMediaFileTagsPathInfo {
  pub media_file_token: MediaFileToken,
}

#[derive(Serialize, ToSchema)]
pub struct ClearMediaFileTagsSuccessResponse {
  pub success: bool,

  /// How many tag links were removed from the media file. (Orphaned
  /// tags are not deleted.)
  pub removed_count: u64,
}
