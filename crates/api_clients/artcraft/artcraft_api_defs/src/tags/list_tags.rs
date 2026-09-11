use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use crate::tags::common::TagDetails;

// ── GET /v1/tags/list ──

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListTagsQueryParams {
  pub cursor: Option<String>,
  pub limit: Option<u32>,
}

#[derive(Serialize, ToSchema)]
pub struct ListTagsSuccessResponse {
  pub success: bool,

  /// The logged-in user's (live) tags, newest first.
  pub tags: Vec<TagDetails>,

  /// Present when there may be more results; pass back as `cursor`.
  pub maybe_cursor: Option<String>,
}
