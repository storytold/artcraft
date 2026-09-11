use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/kling-video/v1.6/pro/text-to-video`.
/// fal's schema: <https://fal.ai/models/fal-ai/kling-video/v1.6/pro/text-to-video/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Kling1p6ProTextToVideoInput {
  pub prompt: String,

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

  /// The CFG (Classifier Free Guidance) scale.
  /// Default value: 0.5
  #[serde(skip_serializing_if = "Option::is_none")]
  pub cfg_scale: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling1p6ProTextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling1p6ProTextToVideoOutput {
  pub video: Kling1p6ProTextToVideoVideoFile,
}
