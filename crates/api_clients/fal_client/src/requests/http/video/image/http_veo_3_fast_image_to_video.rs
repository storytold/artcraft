use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3FastImageToVideoInput {
  pub image_url: String,

  pub prompt: String,

  /// Options: "720p", "1080p"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Options: "4s", "6s", "8s"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3FastImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3FastImageToVideoOutput {
  pub video: Veo3FastImageToVideoVideoFile,
}

pub fn veo_3_fast_image_to_video(
  params: Veo3FastImageToVideoInput,
) -> FalRequest<Veo3FastImageToVideoInput, Veo3FastImageToVideoOutput> {
  FalRequest::new("fal-ai/veo3/fast/image-to-video", params)
}
