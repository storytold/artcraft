use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3TextToVideoInput {
  pub prompt: String,

  /// Options: "16:9", "9:16"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Options: "720p", "1080p"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Options: "4s", "6s", "8s"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3TextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3TextToVideoOutput {
  pub video: Veo3TextToVideoVideoFile,
}

pub fn veo_3_text_to_video(
  params: Veo3TextToVideoInput,
) -> FalRequest<Veo3TextToVideoInput, Veo3TextToVideoOutput> {
  FalRequest::new("fal-ai/veo3", params)
}
