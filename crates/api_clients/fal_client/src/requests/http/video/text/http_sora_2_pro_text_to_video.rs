use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Sora2ProTextToVideoInput {
  pub prompt: String,

  /// Possible enum values: 720p, 1080p
  /// Default value: "1080p"
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
pub struct Sora2ProTextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Sora2ProTextToVideoOutput {
  pub video: Sora2ProTextToVideoVideoFile,
}

pub fn sora_2_pro_text_to_video(
  params: Sora2ProTextToVideoInput,
) -> FalRequest<Sora2ProTextToVideoInput, Sora2ProTextToVideoOutput> {
  FalRequest::new("fal-ai/sora-2/text-to-video/pro", params)
}
