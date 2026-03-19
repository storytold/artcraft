use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3p1FastFirstLastFrameImageToVideoInput {
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
pub struct Veo3p1FastFirstLastFrameImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1FastFirstLastFrameImageToVideoOutput {
  pub video: Veo3p1FastFirstLastFrameImageToVideoVideoFile,
}

pub fn veo_3p1_fast_first_last_frame_image_to_video(
  params: Veo3p1FastFirstLastFrameImageToVideoInput,
) -> FalRequest<Veo3p1FastFirstLastFrameImageToVideoInput, Veo3p1FastFirstLastFrameImageToVideoOutput> {
  FalRequest::new("fal-ai/veo3.1/fast/first-last-frame-to-video", params)
}
