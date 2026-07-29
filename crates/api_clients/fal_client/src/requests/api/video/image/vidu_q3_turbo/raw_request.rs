use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/vidu/q3/image-to-video/turbo`.
/// fal's schema: <https://fal.ai/models/fal-ai/vidu/q3/image-to-video/turbo/api>
///
/// NB: this endpoint has no `aspect_ratio` (derived from the input image).
/// A `prompt` is optional server-side but always sent here.
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ViduQ3TurboImageToVideoInput {
  /// Text prompt (max 2000 characters). Optional server-side.
  pub prompt: String,

  /// URL of the image used as the starting frame (URL or base64).
  pub image_url: String,

  /// Optional URL of an ending frame, for start→end transition videos.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub end_image_url: Option<String>,

  /// Duration in seconds. Range 1–16. fal default: 5.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u8>,

  /// Seed for reproducibility. Random when omitted.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  /// Output resolution.
  /// Possible values: "360p", "540p", "720p", "1080p". fal default: "720p".
  /// (360p is unavailable when `end_image_url` is set.)
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Whether to generate audio for the video. fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub audio: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ViduQ3TurboImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ViduQ3TurboImageToVideoOutput {
  pub video: ViduQ3TurboImageToVideoVideoFile,
}
