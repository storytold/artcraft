use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KlingV2p6ProImageToVideoInput {
  pub prompt: String,

  pub image_url: String,

  /// Options: "5", "10"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV2p6ProImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV2p6ProImageToVideoOutput {
  pub video: KlingV2p6ProImageToVideoVideoFile,
}

pub fn kling_v2p6_pro_image_to_video(
  params: KlingV2p6ProImageToVideoInput,
) -> FalRequest<KlingV2p6ProImageToVideoInput, KlingV2p6ProImageToVideoOutput> {
  FalRequest::new("fal-ai/kling-video/v2.6/pro/image-to-video", params)
}
