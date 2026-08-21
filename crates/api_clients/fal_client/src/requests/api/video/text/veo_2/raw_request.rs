use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/veo2` (text-to-video).
/// fal's schema: <https://fal.ai/models/fal-ai/veo2/api>
///
/// NB: Veo 2 has no `generate_audio`, `resolution`, or `safety_tolerance`
/// fields (unlike the Veo 3 family), and it *does* carry `enhance_prompt`.
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo2TextToVideoInput {
  pub prompt: String,

  /// Aspect ratio.
  /// Possible values: "9:16", "16:9", "1:1". fal default: "16:9".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Duration in seconds (as a string).
  /// Possible values: "5s", "6s", "7s", "8s". fal default: "5s".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Optional negative prompt.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Whether to enhance the prompt before generation. fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enhance_prompt: Option<bool>,

  /// Seed for the random number generator.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  /// Whether to automatically rewrite prompts that fail content policy /
  /// validation checks. fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub auto_fix: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo2TextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo2TextToVideoOutput {
  pub video: Veo2TextToVideoVideoFile,
}
