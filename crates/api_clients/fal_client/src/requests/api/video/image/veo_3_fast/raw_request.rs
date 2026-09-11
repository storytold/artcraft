use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/veo3/fast/image-to-video`.
/// fal's schema: <https://fal.ai/models/fal-ai/veo3/fast/image-to-video/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3FastImageToVideoInput {
  pub prompt: String,

  /// URL of the image used as the starting frame.
  pub image_url: String,

  /// Aspect ratio.
  /// Possible values: "auto", "16:9", "9:16". fal default: "auto".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Duration in seconds (as a string).
  /// Possible values: "4s", "6s", "8s". fal default: "8s".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Output resolution.
  /// Possible values: "720p", "1080p" (no 4k tier). fal default: "720p".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Whether to generate native audio for the video. fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  /// Optional negative prompt.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Seed for the random number generator.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  /// Whether to automatically rewrite prompts that fail moderation.
  /// fal default: false (image-to-video).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub auto_fix: Option<bool>,

  /// Safety tolerance, "1" (strictest) .. "6" (least strict). fal default: "4".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub safety_tolerance: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3FastImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3FastImageToVideoOutput {
  pub video: Veo3FastImageToVideoVideoFile,
}
