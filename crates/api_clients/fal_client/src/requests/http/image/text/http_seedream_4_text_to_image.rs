use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SeedreamV4TextToImageInput {
  pub prompt: String,

  /// Options: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9, auto, auto_2K, auto_4K
  /// Default: "auto_2K"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub max_images: Option<u8>,

  /// Enum: "standard", "fast"
  /// Default: "standard"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enhance_prompt_mode: Option<String>,

  /// Default: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedreamV4TextToImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedreamV4TextToImageOutput {
  pub images: Vec<SeedreamV4TextToImageFile>,
}

pub fn seedream_4_text_to_image(
  params: SeedreamV4TextToImageInput,
) -> FalRequest<SeedreamV4TextToImageInput, SeedreamV4TextToImageOutput> {
  FalRequest::new("fal-ai/bytedance/seedream/v4/text-to-image", params)
}
