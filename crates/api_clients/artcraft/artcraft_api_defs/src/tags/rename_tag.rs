use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::tags::TagToken;

use crate::tags::common::TagDetails;

// ── PUT /v1/tags/rename/{tag_token} ──

#[derive(Deserialize, ToSchema)]
pub struct RenameTagPathInfo {
  pub tag_token: TagToken,
}

#[derive(Deserialize, ToSchema)]
pub struct RenameTagRequest {
  /// The new tag text (trimmed server-side). Both case-only changes and
  /// wholesale renames are allowed. Fails with 400 if the caller already
  /// has a different tag with the same lowercased value.
  pub new_tag_value: String,
}

#[derive(Serialize, ToSchema)]
pub struct RenameTagSuccessResponse {
  pub success: bool,

  /// The tag after the rename.
  pub tag: TagDetails,
}
