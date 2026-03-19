use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Seedance1ProImageToVideoInput {
  pub image_url: String,

  pub prompt: String,

  /// Options: "5", "10"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Options: "480p", "720p", "1080p"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub camera_fixed: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Seedance1ProImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Seedance1ProImageToVideoOutput {
  pub video: Seedance1ProImageToVideoVideoFile,
}

pub fn seedance_1_pro_image_to_video(
  params: Seedance1ProImageToVideoInput,
) -> FalRequest<Seedance1ProImageToVideoInput, Seedance1ProImageToVideoOutput> {
  FalRequest::new("fal-ai/bytedance/seedance/v1/pro/image-to-video", params)
}
