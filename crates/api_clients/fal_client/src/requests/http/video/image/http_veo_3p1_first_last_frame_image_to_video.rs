use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3p1FirstLastFrameImageToVideoInput {
  pub prompt: String,

  pub first_frame_url: String,

  pub last_frame_url: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  /// Options: "4s", "6s", "8s"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Options: "auto", "16:9", "9:16"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Options: "720p", "1080p"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1FirstLastFrameImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1FirstLastFrameImageToVideoOutput {
  pub video: Veo3p1FirstLastFrameImageToVideoVideoFile,
}

pub fn veo_3p1_first_last_frame_image_to_video(
  params: Veo3p1FirstLastFrameImageToVideoInput,
) -> FalRequest<Veo3p1FirstLastFrameImageToVideoInput, Veo3p1FirstLastFrameImageToVideoOutput> {
  FalRequest::new("fal-ai/veo3.1/first-last-frame-to-video", params)
}
