use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct NanoBananaProTextToImageInput {
  pub prompt: String,

  /// Options: auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
  /// Default: "auto"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// "1K", "2K", "4K"
  /// Default: "1K"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// "jpeg", "png", "webp"
  /// Default: "png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NanoBananaProTextToImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NanoBananaProTextToImageOutput {
  pub images: Vec<NanoBananaProTextToImageFile>,
}

pub fn nano_banana_pro_text_to_image(
  params: NanoBananaProTextToImageInput,
) -> FalRequest<NanoBananaProTextToImageInput, NanoBananaProTextToImageOutput> {
  FalRequest::new("fal-ai/nano-banana-pro", params)
}
