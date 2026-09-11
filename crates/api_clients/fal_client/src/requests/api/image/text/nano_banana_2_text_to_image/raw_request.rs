use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct NanoBanana2TextToImageInput {
  pub prompt: String,

  /// Eg. "auto", "16:9", "1:1", etc.
  /// Options: auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
  /// Default: "auto"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Eg. "0.5K", "1K", "2K", "4K"
  /// Default: "1K"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// The safety tolerance level. 1 = most strict, 6 = least strict.
  /// Default: "4"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub safety_tolerance: Option<String>,

  /// "jpeg", "png", "webp"
  /// Default: "png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<u64>,

  /// Limit generations per round of prompting to 1.
  /// Default: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub limit_generations: Option<bool>,

  /// Enable web search for image generation.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_web_search: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NanoBanana2ImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NanoBanana2TextToImageOutput {
  pub images: Vec<NanoBanana2ImageFile>,
}
