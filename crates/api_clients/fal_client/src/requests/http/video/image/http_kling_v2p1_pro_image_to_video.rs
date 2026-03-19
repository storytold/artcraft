use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KlingV2p1ProImageToVideoInput {
  pub image_url: String,

  pub prompt: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub tail_image_url: Option<String>,

  /// Options: "16:9", "9:16", "1:1"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Options: "5", "10"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub cfg_scale: Option<f32>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV2p1ProImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV2p1ProImageToVideoOutput {
  pub video: KlingV2p1ProImageToVideoVideoFile,
}

pub fn kling_v2p1_pro_image_to_video(
  params: KlingV2p1ProImageToVideoInput,
) -> FalRequest<KlingV2p1ProImageToVideoInput, KlingV2p1ProImageToVideoOutput> {
  FalRequest::new("fal-ai/kling-video/v2.1/pro/image-to-video", params)
}
