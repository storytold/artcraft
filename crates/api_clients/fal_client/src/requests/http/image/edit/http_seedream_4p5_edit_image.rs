use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SeedreamV4p5EditImageInput {
  pub prompt: String,

  /// Maximum 10 images. Excess images are ignored.
  pub image_urls: Vec<String>,

  /// Options: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9, auto_2K, auto_4K
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

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  /// Default: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedreamV4p5EditImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedreamV4p5EditImageOutput {
  pub images: Vec<SeedreamV4p5EditImageFile>,
}

pub fn seedream_4p5_edit_image(
  params: SeedreamV4p5EditImageInput,
) -> FalRequest<SeedreamV4p5EditImageInput, SeedreamV4p5EditImageOutput> {
  FalRequest::new("fal-ai/bytedance/seedream/v4.5/edit", params)
}
