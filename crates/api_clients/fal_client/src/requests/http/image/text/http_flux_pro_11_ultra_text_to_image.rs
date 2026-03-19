use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxPro11UltraTextToImageInput {
  pub prompt: String,

  /// Options: 21:9, 16:9, 4:3, 3:2, 1:1, 2:3, 3:4, 9:16, 9:21
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<i64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  /// Generate less processed, more natural-looking images.
  /// Default: false
  #[serde(skip_serializing_if = "Option::is_none")]
  pub raw: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,

  /// "1" (most strict) to "5" (most permissive)
  #[serde(skip_serializing_if = "Option::is_none")]
  pub safety_tolerance: Option<String>,

  /// "png" or "jpeg"
  /// Default: "jpeg"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FluxPro11UltraTextToImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FluxPro11UltraTextToImageOutput {
  pub images: Vec<FluxPro11UltraTextToImageFile>,
}

pub fn flux_pro_11_ultra_text_to_image(
  params: FluxPro11UltraTextToImageInput,
) -> FalRequest<FluxPro11UltraTextToImageInput, FluxPro11UltraTextToImageOutput> {
  FalRequest::new("fal-ai/flux-pro/v1.1-ultra", params)
}
