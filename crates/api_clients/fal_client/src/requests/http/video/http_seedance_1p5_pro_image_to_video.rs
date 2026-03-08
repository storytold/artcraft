use fal::request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Seedance1p5ProImageToVideoInput {
  pub prompt: String,

  pub image_url: String,

  /// URL of the final frame (optional).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub end_image_url: Option<String>,

  /// Possible enum values: 480p, 720p, 1080p
  /// Default value: "720p"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Possible enum values: 21:9, 16:9, 4:3, 1:1, 3:4, 9:16, auto
  /// Default value: "16:9"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Duration in seconds.
  /// Possible enum values: 4, 5, 6, 7, 8, 9, 10, 11, 12
  /// Default value: "5"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Fix camera position during animation.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub camera_fixed: Option<bool>,

  /// Random seed. Use -1 for random generation.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  /// Enable content safety filtering.
  /// Default value: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,

  /// Generate accompanying audio.
  /// Default value: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Seedance1p5ProImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Seedance1p5ProImageToVideoOutput {
  pub video: Seedance1p5ProImageToVideoVideoFile,
}

pub fn seedance_1p5_pro_image_to_video(
  params: Seedance1p5ProImageToVideoInput,
) -> FalRequest<Seedance1p5ProImageToVideoInput, Seedance1p5ProImageToVideoOutput> {
  FalRequest::new("fal-ai/bytedance/seedance/v1.5/pro/image-to-video", params)
}
