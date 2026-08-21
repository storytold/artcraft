use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/vidu/q3/text-to-video`.
/// fal's schema: <https://fal.ai/models/fal-ai/vidu/q3/text-to-video/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ViduQ3TextToVideoInput {
  /// Text prompt (max 2000 characters).
  pub prompt: String,

  /// Duration in seconds. Range 1–16. fal default: 5.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u8>,

  /// Seed for reproducibility. Random when omitted.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  /// Aspect ratio.
  /// Possible values: "16:9", "9:16", "4:3", "3:4", "1:1". fal default: "16:9".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Output resolution.
  /// Possible values: "360p", "540p", "720p", "1080p". fal default: "720p".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Whether to generate audio for the video. fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub audio: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ViduQ3TextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ViduQ3TextToVideoOutput {
  pub video: ViduQ3TextToVideoVideoFile,
}
