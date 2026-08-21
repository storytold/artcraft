use serde_derive::Deserialize;
use utoipa::{IntoParams, ToSchema};

use tokens::tokens::tags::TagToken;

// ── GET /v1/tags/media_files/with_tag/{tag_token} ──
//
// NB: The success response lives in `storyteller_web`'s handler because
// the wire shape embeds `MediaLinks` / `MediaFileCoverImageDetails`
// constructors that depend on the request's `MediaDomain` +
// `ServerEnvironment`.

#[derive(Deserialize, ToSchema)]
pub struct ListMediaFilesWithTagPathInfo {
  pub tag_token: TagToken,
}

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListMediaFilesWithTagQueryParams {
  pub cursor: Option<String>,
  pub limit: Option<u32>,
}
