use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GptImage1EditImageInput {
  pub prompt: String,

  pub image_urls: Vec<String>,

  /// The URL of the mask image indicating what part of the image to edit.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub mask_image_url: Option<String>,

  /// "auto", "1024x1024", "1536x1024", "1024x1536"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  /// "low", "medium", "high"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality: Option<String>,

  /// "low", "high"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub input_fidelity: Option<String>,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// "auto", "transparent", "opaque"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub background: Option<String>,

  /// "jpeg", "png", "webp"
  /// Default: "png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage1EditImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage1EditImageOutput {
  pub images: Vec<GptImage1EditImageFile>,
}
