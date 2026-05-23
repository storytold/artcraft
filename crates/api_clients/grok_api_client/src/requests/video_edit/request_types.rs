use serde_derive::{Deserialize, Serialize};

// ── Request ──

#[derive(Serialize, Debug)]
pub(crate) struct VideoEditRequestBody {
  pub prompt: String,

  pub video: VideoSourceRef,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub model: Option<String>,

  /// Optional `output.upload_url`. See `video_generation` for the
  /// docs-vs-REST-spec discrepancy about whether this is required.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output: Option<VideoEditOutput>,

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

#[derive(Serialize, Debug, Clone)]
pub(crate) struct VideoEditOutput {
  pub upload_url: String,
}

// ── Response ──

#[derive(Deserialize, Debug)]
pub(crate) struct VideoEditResponseBody {
  pub request_id: String,
}
