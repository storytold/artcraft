use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Gemini25FlashTextToImageInput {
  pub prompt: String,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// "jpeg" or "png"
  /// Default: "png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  /// Options: 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
  /// Default: "1:1"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Gemini25FlashTextToImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Gemini25FlashTextToImageOutput {
  pub images: Vec<Gemini25FlashTextToImageFile>,
}

pub fn gemini_25_flash_text_to_image(
  params: Gemini25FlashTextToImageInput,
) -> FalRequest<Gemini25FlashTextToImageInput, Gemini25FlashTextToImageOutput> {
  FalRequest::new("fal-ai/gemini-25-flash-image", params)
}
