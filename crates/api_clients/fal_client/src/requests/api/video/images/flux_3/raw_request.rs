use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `blackforestlabs/flux-3/first-last-frame-to-video`.
/// fal's schema: <https://fal.ai/models/blackforestlabs/flux-3/first-last-frame-to-video/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Flux3FirstLastFrameToVideoInput {
  /// Text prompt for video generation.
  pub prompt: String,

  /// URL of the first frame.
  pub start_image_url: String,

  /// URL of the last frame.
  pub end_image_url: String,

  /// Duration in seconds (5–20). fal default: 5.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u8>,

  /// Output resolution.
  /// Possible values: "720p", "1080p". fal default: "720p".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Aspect ratio.
  /// Possible values: "auto", "21:9", "2:1", "16:9", "4:3", "1:1", "3:4",
  /// "9:16". fal default: "auto".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Whether to generate synchronized audio. fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  /// Safety tolerance, 0 (strictest) to 4 (most permissive). fal default: 2.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub safety_tolerance: Option<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux3FirstLastFrameToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux3FirstLastFrameToVideoOutput {
  pub video: Flux3FirstLastFrameToVideoVideoFile,
}
