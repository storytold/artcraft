use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `minimax/h3/reference-to-video`.
/// fal's schema: <https://fal.ai/models/minimax/h3/reference-to-video/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MinimaxH3ReferenceToVideoInput {
  /// Text prompt (1 to 7000 characters). Refer to reference assets by their
  /// modality and order in the reference lists: Image 1, Image 2, Video 1,
  /// Audio 1, and so on.
  pub prompt: String,

  /// URLs of subject/style reference images (at most 9). Reference images,
  /// videos, and audio clips must add up to at most 12 files.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub reference_image_urls: Option<Vec<String>>,

  /// URLs of motion/reference video clips (at most 3; 2–15 seconds each,
  /// combined duration at most 15 seconds).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub reference_video_urls: Option<Vec<String>>,

  /// URLs of reference audio clips (at most 3; 2–15 seconds each, combined
  /// duration at most 15 seconds). Audio cannot be the only reference input.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub reference_audio_urls: Option<Vec<String>>,

  /// Duration in seconds. Range 5–15. fal default: 5.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u8>,

  /// Output resolution.
  /// Possible values: "768P", "2K". fal default: "2K".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Aspect ratio.
  /// Possible values: "adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16".
  /// fal default: "adaptive".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MinimaxH3ReferenceToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MinimaxH3ReferenceToVideoOutput {
  pub video: MinimaxH3ReferenceToVideoVideoFile,
}
