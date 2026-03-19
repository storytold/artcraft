use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KlingV2p5TurboProImageToVideoInput {
  pub prompt: String,

  pub image_url: String,

  /// Options: "5", "10"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub tail_image_url: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub cfg_scale: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV2p5TurboProImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV2p5TurboProImageToVideoOutput {
  pub video: KlingV2p5TurboProImageToVideoVideoFile,
}

pub fn kling_v2p5_turbo_pro_image_to_video(
  params: KlingV2p5TurboProImageToVideoInput,
) -> FalRequest<KlingV2p5TurboProImageToVideoInput, KlingV2p5TurboProImageToVideoOutput> {
  FalRequest::new("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", params)
}
