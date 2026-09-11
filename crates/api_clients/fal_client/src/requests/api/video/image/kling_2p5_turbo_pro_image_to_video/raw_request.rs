use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`.
/// fal's schema: <https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Kling2p5TurboProImageToVideoInput {
  pub prompt: String,

  /// URL of the image to be used for the video.
  pub image_url: String,

  /// Duration in seconds (as a string).
  /// Possible values: "5", "10"  (fal default: "5")
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// URL of the image to be used for the end of the video.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub tail_image_url: Option<String>,

  /// Optional negative prompt.
  /// fal's default: "blur, distort, and low quality"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// The CFG (Classifier Free Guidance) scale.
  /// Default value: 0.5
  #[serde(skip_serializing_if = "Option::is_none")]
  pub cfg_scale: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling2p5TurboProImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling2p5TurboProImageToVideoOutput {
  pub video: Kling2p5TurboProImageToVideoVideoFile,
}
