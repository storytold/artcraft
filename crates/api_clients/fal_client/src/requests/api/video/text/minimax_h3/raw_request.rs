use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `minimax/h3/text-to-video`.
/// fal's schema: <https://fal.ai/models/minimax/h3/text-to-video/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MinimaxH3TextToVideoInput {
  /// Text prompt (1 to 7000 characters).
  pub prompt: String,

  /// Duration in seconds. Range 5–15. fal default: 5.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u8>,

  /// Output resolution.
  /// Possible values: "768P", "2K". fal default: "2K".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Aspect ratio.
  /// Possible values: "21:9", "16:9", "4:3", "1:1", "3:4", "9:16". fal default: "16:9".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MinimaxH3TextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MinimaxH3TextToVideoOutput {
  pub video: MinimaxH3TextToVideoVideoFile,
}
