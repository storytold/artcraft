use serde_derive::{Deserialize, Serialize};

// ── Request ──

#[derive(Serialize, Debug)]
pub(crate) struct VideoExtensionRequestBody {
  pub prompt: String,

  pub video: VideoExtensionSourceRef,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub model: Option<String>,

  /// Length of the *extension only*, not the total output. xAI default is 6
  /// seconds; range 1–10.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u32>,

  /// Optional `output.upload_url`. See `video_generation` for the
  /// docs-vs-REST-spec discrepancy.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output: Option<VideoExtensionOutput>,
}

#[derive(Serialize, Debug, Clone)]
pub(crate) struct VideoExtensionSourceRef {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub url: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_id: Option<String>,
}

#[derive(Serialize, Debug, Clone)]
pub(crate) struct VideoExtensionOutput {
  pub upload_url: String,
}

// ── Response ──

#[derive(Deserialize, Debug)]
pub(crate) struct VideoExtensionResponseBody {
  pub request_id: String,
}
