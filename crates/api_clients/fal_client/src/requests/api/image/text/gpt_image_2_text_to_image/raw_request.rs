use serde::{Deserialize, Serialize};
use crate::requests::api::image::common::gpt_image_2_resolution::CustomImageSize;

/// The `image_size` field can be either a string enum value (e.g. "square")
/// or a custom object with explicit width/height.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum ImageSizeParam {
  Preset(String),
  Custom(CustomImageSize),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage2TextToImageInput {
  pub prompt: String,

  /// square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
  /// OR a custom { width, height } object.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<ImageSizeParam>,

  /// "low", "medium", "high"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality: Option<String>,

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
pub struct GptImage2TextToImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage2TextToImageOutput {
  pub images: Vec<GptImage2TextToImageFile>,
}
