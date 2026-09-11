use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

use crate::tags::common::TagDetails;

// ── POST /v1/tags/media_file/add/{media_file_token} ──

#[derive(Deserialize, ToSchema)]
pub struct AddMediaFileTagsPathInfo {
  pub media_file_token: MediaFileToken,
}

/// Exactly one of `maybe_tags` / `maybe_tags_list` must be set (400 if
/// both or neither). Tag text is trimmed and deduped case-insensitively;
/// empty entries are dropped. Must sanitize to at least one tag (400
/// otherwise).
#[derive(Deserialize, ToSchema)]
pub struct AddMediaFileTagsRequest {
  /// Comma-separated tags, e.g. `"cats, Sci-Fi, wallpaper"`.
  pub maybe_tags: Option<String>,

  /// Tags as a list. Entries are still trimmed.
  pub maybe_tags_list: Option<Vec<String>>,
}

#[derive(Serialize, ToSchema)]
pub struct AddMediaFileTagsSuccessResponse {
  pub success: bool,

  /// The tags from this request after upsert, with canonical tokens and
  /// fresh use counts. Tags already on the file are absorbed (no error).
  pub tags: Vec<TagDetails>,
}
