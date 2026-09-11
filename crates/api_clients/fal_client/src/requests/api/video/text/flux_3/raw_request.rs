use serde::{Deserialize, Serialize};

use crate::requests::api::video::text::flux_3::api::Flux3Duration;

/// Over-the-wire input shape for `blackforestlabs/flux-3/text-to-video`.
/// fal's schema: <https://fal.ai/models/blackforestlabs/flux-3/text-to-video/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Flux3TextToVideoInput {
  /// Text prompt for video generation.
  pub prompt: String,

  /// Duration in seconds ("auto" or 5–20). fal default: "auto" (the model
  /// picks a duration that fits the prompt).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<Flux3Duration>,

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
pub struct Flux3VideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux3TextToVideoOutput {
  pub video: Flux3VideoFile,
}
