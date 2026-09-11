use serde_derive::{Deserialize, Serialize};

// ── Request ──

#[derive(Serialize, Debug)]
pub(crate) struct ImageEditRequestBody {
  pub prompt: String,

  /// Exactly one of `image` or `images` is sent (single vs. multi-image edit).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image: Option<ImageRef>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub images: Option<Vec<ImageRef>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub model: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub n: Option<u32>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub response_format: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub user: Option<String>,
}

/// xAI image reference — exactly one of `url` or `file_id` is set.
#[derive(Serialize, Debug, Clone)]
pub(crate) struct ImageRef {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub url: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_id: Option<String>,
}

// ── Response ──

#[derive(Deserialize, Debug)]
pub(crate) struct ImageEditResponseBody {
  pub data: Vec<ImageEditResponseDatum>,
}

#[derive(Deserialize, Debug)]
pub(crate) struct ImageEditResponseDatum {
  pub url: Option<String>,
  pub b64_json: Option<String>,
  pub revised_prompt: Option<String>,
}
