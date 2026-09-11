use serde_derive::{Deserialize, Serialize};

// ── Request ──

#[derive(Serialize, Debug)]
pub(crate) struct ImageGenerationRequestBody {
  pub prompt: String,

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

// ── Response ──

#[derive(Deserialize, Debug)]
pub(crate) struct ImageGenerationResponseBody {
  pub data: Vec<ImageGenerationResponseDatum>,
}

#[derive(Deserialize, Debug)]
pub(crate) struct ImageGenerationResponseDatum {
  pub url: Option<String>,
  pub b64_json: Option<String>,

  /// xAI may revise the prompt (their docs call this "revised_prompt" in
  /// OpenAI-compat responses). Optional, included if present.
  pub revised_prompt: Option<String>,
}
