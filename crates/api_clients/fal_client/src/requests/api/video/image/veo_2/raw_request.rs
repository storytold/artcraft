use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/veo2/image-to-video`.
/// fal's schema: <https://fal.ai/models/fal-ai/veo2/image-to-video/api>
///
/// NB: Veo 2 image-to-video has a minimal schema — only `prompt`, `image_url`,
/// and `duration`. There is no aspect_ratio, negative_prompt, seed, auto_fix,
/// enhance_prompt, resolution, or generate_audio (aspect ratio is taken from
/// the input image).
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo2ImageToVideoInput {
  pub prompt: String,

  /// URL of the input image to animate (720p+, 16:9 or 9:16).
  pub image_url: String,

  /// Duration in seconds (as a string).
  /// Possible values: "5s", "6s", "7s", "8s". fal default: "5s".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo2ImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo2ImageToVideoOutput {
  pub video: Veo2ImageToVideoVideoFile,
}
