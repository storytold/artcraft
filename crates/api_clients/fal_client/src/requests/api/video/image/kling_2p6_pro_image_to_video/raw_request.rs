use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/kling-video/v2.6/pro/image-to-video`.
/// fal's schema: <https://fal.ai/models/fal-ai/kling-video/v2.6/pro/image-to-video>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Kling2p6ProImageToVideoInput {
  pub prompt: String,

  /// URL of the image used as the first frame.
  pub start_image_url: String,

  /// URL of the image used as the last frame (optional).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub end_image_url: Option<String>,

  /// Duration in seconds (as a string).
  /// Possible values: "5", "10"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Optional negative prompt.
  /// fal's default: "blur, distort, and low quality"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Whether to generate native audio for the video.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  /// Voice IDs for video generation. Reference them in the prompt with
  /// `<<<voice_1>>>` and `<<<voice_2>>>` — maximum of 2 voices per task.
  /// Sourced from fal's `create-voice` endpoint.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub voice_ids: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling2p6ProImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling2p6ProImageToVideoOutput {
  pub video: Kling2p6ProImageToVideoVideoFile,
}
