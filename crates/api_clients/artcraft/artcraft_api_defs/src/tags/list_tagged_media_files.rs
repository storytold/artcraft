use serde_derive::Deserialize;
use utoipa::{IntoParams, ToSchema};

// ── GET /v1/tags/media_files/list_tagged ──
//
// NB: The success response lives in `storyteller_web`'s handler because
// the wire shape embeds `MediaLinks` / `MediaFileCoverImageDetails`
// constructors that depend on the request's `MediaDomain` +
// `ServerEnvironment`.

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListTaggedMediaFilesQueryParams {
  pub cursor: Option<String>,
  pub limit: Option<u32>,
}
