use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

use crate::tags::common::TagDetails;

// ── POST /v1/tags/bulk_set ──

/// Exactly one of `maybe_tags` / `maybe_tags_list` must be set (400 if
/// both or neither). Tag text is trimmed and deduped case-insensitively;
/// empty entries are dropped. Unlike `bulk_add`, sanitizing down to zero
/// tags is allowed — it clears all tags from the listed media files.
/// Media file tokens are deduped; tokens the user doesn't own (or that
/// are deleted) are silently skipped.
#[derive(Deserialize, ToSchema)]
pub struct BulkSetTagsRequest {
  /// Media files whose tag sets will be replaced.
  pub media_file_tokens: Vec<MediaFileToken>,

  /// Comma-separated tags, e.g. `"cats, Sci-Fi, wallpaper"`.
  pub maybe_tags: Option<String>,

  /// Tags as a list. Entries are still trimmed.
  pub maybe_tags_list: Option<Vec<String>>,
}

#[derive(Serialize, ToSchema)]
pub struct BulkSetTagsSuccessResponse {
  pub success: bool,

  /// The subset of the input tokens that were actually updated: files
  /// that exist, aren't deleted, and are owned by the caller.
  pub accepted_media_file_tokens: Vec<MediaFileToken>,

  /// The full tag set now on every accepted media file, with canonical
  /// tokens and fresh use counts.
  pub tags: Vec<TagDetails>,

  /// How many previously-attached tag links were removed across all the
  /// accepted media files because they weren't mentioned in the request.
  /// (Orphaned tags are not deleted.)
  pub removed_count: u64,
}
