use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Sora2ProImageToVideoInput {
  pub prompt: String,

  /// Starting frame image URL.
  pub image_url: String,

  /// Possible enum values: auto, 720p, 1080p
  /// Default value: "auto"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Possible enum values: auto, 9:16, 16:9
  /// Default value: "auto"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Duration in seconds.
  /// Possible enum values: 4, 8, 12
  /// Default value: 4
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u8>,

  /// Whether to delete the video after generation for privacy reasons.
  /// Default value: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub delete_video: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Sora2ProImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Sora2ProImageToVideoOutput {
  pub video: Sora2ProImageToVideoVideoFile,
}

pub fn sora_2_pro_image_to_video(
  params: Sora2ProImageToVideoInput,
) -> FalRequest<Sora2ProImageToVideoInput, Sora2ProImageToVideoOutput> {
  FalRequest::new("fal-ai/sora-2/image-to-video/pro", params)
}
