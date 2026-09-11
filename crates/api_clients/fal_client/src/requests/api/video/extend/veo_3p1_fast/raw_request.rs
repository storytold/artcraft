use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/veo3.1/fast/extend-video`.
/// Extends an existing video by generating a continuation.
/// fal's schema: <https://fal.ai/models/fal-ai/veo3.1/fast/extend-video/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3p1FastExtendVideoInput {
  pub prompt: String,

  /// URL of the video to extend. Should be 720p or 1080p, 16:9 or 9:16.
  pub video_url: String,

  /// Aspect ratio.
  /// Possible values: "auto", "16:9", "9:16". fal default: "auto".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Duration in seconds (as a string). fal default: "7s". fal documents no
  /// explicit enum for this endpoint (only the default), so it is sent as a
  /// free-form string.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Optional negative prompt.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Output resolution. fal default: "720p" (the docs describe 720p/1080p
  /// source requirements and list no 4k tier for extend).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Whether to generate native audio for the video. fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  /// Seed for the random number generator.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  /// Whether to automatically rewrite prompts that fail moderation.
  /// fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub auto_fix: Option<bool>,

  /// Safety tolerance, "1" (strictest) .. "6" (least strict). fal default: "4".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub safety_tolerance: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1FastExtendVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1FastExtendVideoOutput {
  pub video: Veo3p1FastExtendVideoVideoFile,
}
