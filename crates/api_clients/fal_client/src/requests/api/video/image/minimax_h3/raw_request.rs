use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `minimax/h3/image-to-video`.
/// fal's schema: <https://fal.ai/models/minimax/h3/image-to-video/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MinimaxH3ImageToVideoInput {
  /// Text prompt (1 to 7000 characters).
  pub prompt: String,

  /// URL of the image to use as the first frame. The output aspect ratio
  /// follows this image.
  pub image_url: String,

  /// Optional URL of the image to use as the last frame, for first-to-last
  /// keyframe generation.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub end_image_url: Option<String>,

  /// Duration in seconds. Range 5–15. fal default: 5.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u8>,

  /// Output resolution.
  /// Possible values: "768P", "2K". fal default: "2K".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MinimaxH3ImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MinimaxH3ImageToVideoOutput {
  pub video: MinimaxH3ImageToVideoVideoFile,
}
