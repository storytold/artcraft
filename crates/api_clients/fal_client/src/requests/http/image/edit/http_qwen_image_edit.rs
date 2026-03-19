use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct QwenImageEditInput {
  pub prompt: String,

  pub image_url: String,

  /// Options: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// "jpeg" or "png"
  /// Default: "png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<u64>,

  /// Default: 30
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_inference_steps: Option<u8>,

  /// Default: 4.0
  #[serde(skip_serializing_if = "Option::is_none")]
  pub guidance_scale: Option<f64>,

  /// Default: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,

  /// Options: "none", "regular", "high"
  /// Default: "none"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub acceleration: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QwenImageEditFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QwenImageEditOutput {
  pub images: Vec<QwenImageEditFile>,
}

pub fn qwen_image_edit(
  params: QwenImageEditInput,
) -> FalRequest<QwenImageEditInput, QwenImageEditOutput> {
  FalRequest::new("fal-ai/qwen-image-edit", params)
}
