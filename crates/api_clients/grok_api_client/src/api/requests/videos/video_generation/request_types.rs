use serde_derive::{Deserialize, Serialize};

// ── Request ──

#[derive(Serialize, Debug)]
pub(crate) struct VideoGenerationRequestBody {
  pub prompt: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub model: Option<String>,

  /// Image-to-video: single source image. Mutually exclusive with
  /// `reference_images`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image: Option<VideoImageRef>,

  /// Reference-to-video: array of reference images.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub reference_images: Option<Vec<VideoImageRef>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u32>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub user: Option<String>,
}

/// xAI image/video reference — exactly one of `url` or `file_id` is set.
#[derive(Serialize, Debug, Clone)]
pub(crate) struct VideoImageRef {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub url: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_id: Option<String>,
}

// ── Response ──

#[derive(Deserialize, Debug)]
pub(crate) struct VideoGenerationResponseBody {
  pub request_id: String,
}
