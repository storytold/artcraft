use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Sora2ImageToVideoInput {
  pub prompt: String,

  /// Starting frame image URL.
  pub image_url: String,

  /// Possible enum values: auto, 720p
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
pub struct Sora2ImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Sora2ImageToVideoOutput {
  pub video: Sora2ImageToVideoVideoFile,
}

pub fn sora_2_image_to_video(
  params: Sora2ImageToVideoInput,
) -> FalRequest<Sora2ImageToVideoInput, Sora2ImageToVideoOutput> {
  FalRequest::new("fal-ai/sora-2/image-to-video", params)
}
