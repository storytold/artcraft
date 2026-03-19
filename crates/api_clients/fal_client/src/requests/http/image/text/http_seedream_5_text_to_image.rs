use fal::request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SeedreamV5LiteTextToImageInput {
  pub prompt: String,

  /// Options: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9, auto_2K, auto_3K
  /// Default: "auto_2K"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub max_images: Option<u8>,

  /// Default: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedreamV5LiteImageFile {
  pub url: String,
  //pub content_type: Option<String>,
  //pub file_name: Option<String>,
  //pub file_size: Option<u64>,
  //pub width: Option<u32>,
  //pub height: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedreamV5LiteTextToImageOutput {
  pub images: Vec<SeedreamV5LiteImageFile>,
  pub seed: u64,
}

pub fn http_seedream_5_text_to_image(
  params: SeedreamV5LiteTextToImageInput,
) -> FalRequest<SeedreamV5LiteTextToImageInput, SeedreamV5LiteTextToImageOutput> {
  FalRequest::new("fal-ai/bytedance/seedream/v5/lite/text-to-image", params)
}
