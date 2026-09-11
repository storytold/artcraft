use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/veo3.1/reference-to-video`.
/// Reference images drive subject/appearance consistency.
/// fal's schema: <https://fal.ai/models/fal-ai/veo3.1/reference-to-video/api>
///
/// NB: unlike the other Veo 3.1 modalities, this endpoint's schema does NOT
/// expose `negative_prompt` or `seed`.
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3p1ReferenceToVideoInput {
  pub prompt: String,

  /// URLs of the reference images used for consistent subject appearance.
  pub image_urls: Vec<String>,

  /// Aspect ratio.
  /// Possible values: "16:9", "9:16". fal default: "16:9".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Duration in seconds (as a string).
  /// Possible values: "4s", "6s", "8s". fal default: "8s".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Output resolution.
  /// Possible values: "720p", "1080p", "4k". fal default: "720p".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Whether to generate native audio for the video. fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  /// Whether to automatically rewrite prompts that fail moderation.
  /// fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub auto_fix: Option<bool>,

  /// Safety tolerance, "1" (strictest) .. "6" (least strict). fal default: "4".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub safety_tolerance: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1ReferenceToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1ReferenceToVideoOutput {
  pub video: Veo3p1ReferenceToVideoVideoFile,
}
