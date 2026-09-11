use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

use crate::tags::common::TagDetails;

// ── POST /v1/tags/media_files/bulk_list_tags ──
//
// POST rather than GET: the token list belongs in a request body, and
// GET request bodies are non-standard. The operation is still a pure
// read.

#[derive(Deserialize, ToSchema)]
pub struct BulkListMediaFileTagsRequest {
  /// Media files to look up. Tokens with no tags come back with an
  /// empty `tags` list.
  pub media_file_tokens: Vec<MediaFileToken>,
}

#[derive(Serialize, ToSchema)]
pub struct MediaFileTagsEntry {
  pub media_file_token: MediaFileToken,
  pub tags: Vec<TagDetails>,
}

#[derive(Serialize, ToSchema)]
pub struct BulkListMediaFileTagsSuccessResponse {
  pub success: bool,

  /// One entry per requested media file token (deduped), in request order.
  pub media_files: Vec<MediaFileTagsEntry>,
}
