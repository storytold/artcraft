use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/kling-video/v2.5-turbo/pro/text-to-video`.
/// fal's schema: <https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Kling2p5TurboProTextToVideoInput {
  pub prompt: String,

  /// Aspect ratio.
  /// Possible values: "16:9", "9:16", "1:1"  (fal default: "16:9")
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Optional negative prompt.
  /// fal's default: "blur, distort, and low quality"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Duration in seconds (as a string).
  /// Possible values: "5", "10"  (fal default: "5")
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// The CFG (Classifier Free Guidance) scale.
  /// Default value: 0.5
  #[serde(skip_serializing_if = "Option::is_none")]
  pub cfg_scale: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling2p5TurboProTextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling2p5TurboProTextToVideoOutput {
  pub video: Kling2p5TurboProTextToVideoVideoFile,
}
