use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3p1FastImageToVideoInput {
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
pub struct Veo3p1FastImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1FastImageToVideoOutput {
  pub video: Veo3p1FastImageToVideoVideoFile,
}

pub fn veo_3p1_fast_image_to_video(
  params: Veo3p1FastImageToVideoInput,
) -> FalRequest<Veo3p1FastImageToVideoInput, Veo3p1FastImageToVideoOutput> {
  FalRequest::new("fal-ai/veo3.1/fast/image-to-video", params)
}
