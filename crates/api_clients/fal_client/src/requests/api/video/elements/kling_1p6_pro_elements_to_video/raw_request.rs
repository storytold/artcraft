use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/kling-video/v1.6/pro/elements`.
/// fal's schema: <https://fal.ai/models/fal-ai/kling-video/v1.6/pro/elements/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Kling1p6ProElementsToVideoInput {
  pub prompt: String,

  /// List of image URLs that drive the generation. fal documents support
  /// for up to 4 images.
  pub input_image_urls: Vec<String>,

  /// Aspect ratio.
  /// Possible values: "16:9", "9:16", "1:1"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Duration in seconds (as a string).
  /// Possible values: "5", "10"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Optional negative prompt.
  /// fal's default: "blur, distort, and low quality"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling1p6ProElementsToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling1p6ProElementsToVideoOutput {
  pub video: Kling1p6ProElementsToVideoVideoFile,
}
