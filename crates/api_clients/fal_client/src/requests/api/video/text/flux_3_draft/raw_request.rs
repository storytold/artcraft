use serde::{Deserialize, Serialize};

use crate::requests::api::video::text::flux_3::api::Flux3Duration;

/// Over-the-wire input shape for `blackforestlabs/flux-3/text-to-video/draft`.
/// fal's schema: <https://fal.ai/models/blackforestlabs/flux-3/text-to-video/draft/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Flux3DraftTextToVideoInput {
  /// Text prompt for video generation.
  pub prompt: String,

  /// Duration in seconds ("auto" or 5–20). fal default: "auto" (the model
  /// picks a duration that fits the prompt).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<Flux3Duration>,

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
pub struct Flux3DraftVideoFile {
  pub url: String,
}

/// Draft outputs carry the 720p draft video plus a durable encrypted cache
/// bundle whose URL can be passed to `draft-enhance` for a full-quality
/// 1080p render.
#[derive(Debug, Serialize, Deserialize)]
pub struct Flux3DraftTextToVideoOutput {
  pub video: Flux3DraftVideoFile,
  pub draft_cache: Flux3DraftVideoFile,
}
