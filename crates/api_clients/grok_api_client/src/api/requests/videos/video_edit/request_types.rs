use serde_derive::{Deserialize, Serialize};

// ── Request ──

#[derive(Serialize, Debug)]
pub(crate) struct VideoEditRequestBody {
  pub prompt: String,

  pub video: VideoSourceRef,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub model: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub user: Option<String>,
}

#[derive(Serialize, Debug, Clone)]
pub(crate) struct VideoSourceRef {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub url: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_id: Option<String>,
}

// ── Response ──

#[derive(Deserialize, Debug)]
pub(crate) struct VideoEditResponseBody {
  pub request_id: String,
}
