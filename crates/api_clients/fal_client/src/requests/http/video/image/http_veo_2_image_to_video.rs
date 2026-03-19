use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo2ImageToVideoInput {
  pub image_url: String,

  pub prompt: String,

  /// Options: "auto", "16:9", "9:16"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Options: "4s", "6s", "8s"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo2ImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo2ImageToVideoOutput {
  pub video: Veo2ImageToVideoVideoFile,
}

pub fn veo_2_image_to_video(
  params: Veo2ImageToVideoInput,
) -> FalRequest<Veo2ImageToVideoInput, Veo2ImageToVideoOutput> {
  FalRequest::new("fal-ai/veo2/image-to-video", params)
}
