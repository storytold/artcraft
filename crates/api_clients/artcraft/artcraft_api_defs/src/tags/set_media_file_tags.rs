use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

use crate::tags::common::TagDetails;

// ── POST /v1/tags/media_file/set/{media_file_token} ──

#[derive(Deserialize, ToSchema)]
pub struct SetMediaFileTagsPathInfo {
  pub media_file_token: MediaFileToken,
}

/// Exactly one of `maybe_tags` / `maybe_tags_list` must be set (400 if
/// both or neither). Tag text is trimmed and deduped case-insensitively;
/// empty entries are dropped. Unlike `add`, sanitizing down to zero tags
/// is allowed — it clears all tags from the media file.
#[derive(Deserialize, ToSchema)]
pub struct SetMediaFileTagsRequest {
  /// Comma-separated tags, e.g. `"cats, Sci-Fi, wallpaper"`.
  pub maybe_tags: Option<String>,

  /// Tags as a list. Entries are still trimmed.
  pub maybe_tags_list: Option<Vec<String>>,
}

#[derive(Serialize, ToSchema)]
pub struct SetMediaFileTagsSuccessResponse {
  pub success: bool,

  /// The media file's full tag set after the operation, with canonical
  /// tokens and fresh use counts.
  pub tags: Vec<TagDetails>,

  /// How many previously-attached tag links were removed because they
  /// weren't mentioned in the request. (Orphaned tags are not deleted.)
  pub removed_count: u64,
}
