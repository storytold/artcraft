use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `blackforestlabs/flux-3/keyframes-to-video`.
/// fal's schema: <https://fal.ai/models/blackforestlabs/flux-3/keyframes-to-video/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Flux3KeyframesToVideoInput {
  /// Text prompt for video generation.
  pub prompt: String,

  /// Keyframe images pinned to frame positions (1 to 10 entries with unique
  /// `frame_index` values).
  pub keyframes: Vec<Flux3Keyframe>,

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

/// A keyframe image pinned to a frame position in the generated 24 fps video.
/// Shared by the full-quality and draft keyframes endpoints.
#[derive(Clone, Debug, Serialize, Deserialize, Default, Eq, PartialEq)]
pub struct Flux3Keyframe {
  /// URL of the keyframe image (PNG, JPEG, or WebP).
  pub image_url: String,

  /// Frame position of this keyframe in the generated 24 fps video. Must be
  /// unique and at most `duration * 24`.
  pub frame_index: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux3KeyframesToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux3KeyframesToVideoOutput {
  pub video: Flux3KeyframesToVideoVideoFile,
}
