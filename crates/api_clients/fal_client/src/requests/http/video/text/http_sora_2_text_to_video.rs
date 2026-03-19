use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Sora2TextToVideoInput {
  pub prompt: String,

  /// Possible enum values: 720p
  /// Default value: "720p"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Possible enum values: 9:16, 16:9
  /// Default value: "16:9"
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
pub struct Sora2TextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Sora2TextToVideoOutput {
  pub video: Sora2TextToVideoVideoFile,
}

pub fn sora_2_text_to_video(
  params: Sora2TextToVideoInput,
) -> FalRequest<Sora2TextToVideoInput, Sora2TextToVideoOutput> {
  FalRequest::new("fal-ai/sora-2/text-to-video", params)
}
