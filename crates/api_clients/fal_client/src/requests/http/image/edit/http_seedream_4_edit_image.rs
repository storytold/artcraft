use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SeedreamV4EditImageInput {
  pub prompt: String,

  /// Maximum 10 images. Excess images are ignored.
  pub image_urls: Vec<String>,

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
pub struct SeedreamV4EditImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedreamV4EditImageOutput {
  pub images: Vec<SeedreamV4EditImageFile>,
}

pub fn seedream_4_edit_image(
  params: SeedreamV4EditImageInput,
) -> FalRequest<SeedreamV4EditImageInput, SeedreamV4EditImageOutput> {
  FalRequest::new("fal-ai/bytedance/seedream/v4/edit", params)
}
