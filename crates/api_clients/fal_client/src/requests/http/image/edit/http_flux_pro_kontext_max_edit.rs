use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProKontextMaxEditInput {
  pub prompt: String,

  pub image_url: String,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<i64>,

  /// "png" or "jpeg"
  /// Default: "jpeg"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  /// Aspect ratio for the generated image.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// The safety tolerance level for content moderation.
  /// "1" (most strict) to "5" (most permissive).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub safety_tolerance: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FluxProKontextMaxEditFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FluxProKontextMaxEditOutput {
  pub images: Vec<FluxProKontextMaxEditFile>,
}

pub fn flux_pro_kontext_max_edit(
  params: FluxProKontextMaxEditInput,
) -> FalRequest<FluxProKontextMaxEditInput, FluxProKontextMaxEditOutput> {
  FalRequest::new("fal-ai/flux-pro/kontext/max", params)
}
