use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

use crate::tags::common::TagDetails;

// ── POST /v1/tags/bulk_add ──

/// Exactly one of `maybe_tags` / `maybe_tags_list` must be set (400 if
/// both or neither). Tag text is trimmed and deduped case-insensitively;
/// empty entries are dropped. Must sanitize to at least one tag (400
/// otherwise). Media file tokens are deduped; tokens the user doesn't
/// own (or that are deleted) are silently skipped.
#[derive(Deserialize, ToSchema)]
pub struct BulkAddTagsRequest {
  /// Media files to tag.
  pub media_file_tokens: Vec<MediaFileToken>,

  /// Comma-separated tags, e.g. `"cats, Sci-Fi, wallpaper"`.
  pub maybe_tags: Option<String>,

  /// Tags as a list. Entries are still trimmed.
  pub maybe_tags_list: Option<Vec<String>>,
}

#[derive(Serialize, ToSchema)]
pub struct BulkAddTagsSuccessResponse {
  pub success: bool,

  /// The subset of the input tokens that were actually tagged: files
  /// that exist, aren't deleted, and are owned by the caller.
  pub accepted_media_file_tokens: Vec<MediaFileToken>,

  /// The tags from this request after upsert, with canonical tokens and
  /// fresh use counts.
  pub tags: Vec<TagDetails>,
}
