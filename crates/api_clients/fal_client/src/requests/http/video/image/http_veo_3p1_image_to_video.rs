use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3p1ImageToVideoInput {
  pub prompt: String,

  pub image_url: String,

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
pub struct Veo3p1ImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1ImageToVideoOutput {
  pub video: Veo3p1ImageToVideoVideoFile,
}

pub fn veo_3p1_image_to_video(
  params: Veo3p1ImageToVideoInput,
) -> FalRequest<Veo3p1ImageToVideoInput, Veo3p1ImageToVideoOutput> {
  FalRequest::new("fal-ai/veo3.1/image-to-video", params)
}
