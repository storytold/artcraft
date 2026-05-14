use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GptImage2EditImageInput {
  pub prompt: String,

  pub image_urls: Vec<String>,

  /// The URL of the mask image to use for the generation.
  /// This indicates what part of the image to edit.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub mask_url: Option<String>,

  /// square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9, auto
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

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
pub struct GptImage2EditImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage2EditImageOutput {
  pub images: Vec<GptImage2EditImageFile>,
}
