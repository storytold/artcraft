use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3p1TextToVideoInput {
  pub prompt: String,

  /// Options: "auto", "9:16", "16:9", "1:1"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Options: "4s", "6s", "8s"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Optional negative prompt
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub enhance_prompt: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub auto_fix: Option<bool>,

  /// Options: "720p", "1080p"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1TextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1TextToVideoOutput {
  pub video: Veo3p1TextToVideoVideoFile,
}

pub fn veo_3p1_text_to_video(
  params: Veo3p1TextToVideoInput,
) -> FalRequest<Veo3p1TextToVideoInput, Veo3p1TextToVideoOutput> {
  FalRequest::new("fal-ai/veo3.1", params)
}
