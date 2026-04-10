use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo2TextToVideoInput {
  pub prompt: String,

  /// Options: "16:9", "9:16", "1:1"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Options: "5s", "6s", "7s", "8s"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo2TextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo2TextToVideoOutput {
  pub video: Veo2TextToVideoVideoFile,
}

pub fn veo_2_text_to_video(
  params: Veo2TextToVideoInput,
) -> FalRequest<Veo2TextToVideoInput, Veo2TextToVideoOutput> {
  FalRequest::new("fal-ai/veo2", params)
}
