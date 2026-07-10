use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

use crate::tags::common::TagDetails;

// ── GET /v1/tags/media_file/list/{media_file_token} ──

#[derive(Deserialize, ToSchema)]
pub struct ListMediaFileTagsPathInfo {
  pub media_file_token: MediaFileToken,
}

#[derive(Serialize, ToSchema)]
pub struct ListMediaFileTagsSuccessResponse {
  pub success: bool,

  /// All (live) tags on the media file, sorted by tag value.
  pub tags: Vec<TagDetails>,
}
