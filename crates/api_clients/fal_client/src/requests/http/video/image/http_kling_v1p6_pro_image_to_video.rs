use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KlingV1p6ProImageToVideoInput {
  pub image_url: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub tail_image_url: Option<String>,

  pub prompt: String,

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
pub struct KlingV1p6ProImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV1p6ProImageToVideoOutput {
  pub video: KlingV1p6ProImageToVideoVideoFile,
}

pub fn kling_v1p6_pro_image_to_video(
  params: KlingV1p6ProImageToVideoInput,
) -> FalRequest<KlingV1p6ProImageToVideoInput, KlingV1p6ProImageToVideoOutput> {
  FalRequest::new("fal-ai/kling-video/v1.6/pro/image-to-video", params)
}
