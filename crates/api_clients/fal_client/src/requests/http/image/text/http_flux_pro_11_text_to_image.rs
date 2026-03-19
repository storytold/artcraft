use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxPro11TextToImageInput {
  pub prompt: String,

  /// Options: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<i64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

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
pub struct FluxPro11TextToImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FluxPro11TextToImageOutput {
  pub images: Vec<FluxPro11TextToImageFile>,
}

pub fn flux_pro_11_text_to_image(
  params: FluxPro11TextToImageInput,
) -> FalRequest<FluxPro11TextToImageInput, FluxPro11TextToImageOutput> {
  FalRequest::new("fal-ai/flux-pro/v1.1", params)
}
