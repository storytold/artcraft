use serde::{Deserialize, Serialize};

use crate::requests::api::video::keyframes::flux_3::raw_request::Flux3Keyframe;

/// Over-the-wire input shape for `blackforestlabs/flux-3/keyframes-to-video/draft`.
/// fal's schema: <https://fal.ai/models/blackforestlabs/flux-3/keyframes-to-video/draft/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Flux3DraftKeyframesToVideoInput {
  /// Text prompt for video generation.
  pub prompt: String,

  /// Keyframe images pinned to frame positions (1 to 10 entries with unique
  /// `frame_index` values).
  pub keyframes: Vec<Flux3Keyframe>,

  /// Duration in seconds (5–20). fal default: 5.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u8>,

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
pub struct Flux3DraftKeyframesToVideoVideoFile {
  pub url: String,
}

/// Draft outputs carry the 720p draft video plus a durable encrypted cache
/// bundle whose URL can be passed to `draft-enhance` for a full-quality
/// 1080p render.
#[derive(Debug, Serialize, Deserialize)]
pub struct Flux3DraftKeyframesToVideoOutput {
  pub video: Flux3DraftKeyframesToVideoVideoFile,
  pub draft_cache: Flux3DraftKeyframesToVideoVideoFile,
}
