use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Seedance1LiteImageToVideoInput {
  pub image_url: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub end_image_url: Option<String>,

  pub prompt: String,

  /// Options: "5", "10"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Options: "480p", "720p", "1080p"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Options: "16:9", "9:16", "1:1"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub camera_fixed: Option<bool>,

  pub seed: i64,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Seedance1LiteImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Seedance1LiteImageToVideoOutput {
  pub video: Seedance1LiteImageToVideoVideoFile,
}

pub fn seedance_1_lite_image_to_video(
  params: Seedance1LiteImageToVideoInput,
) -> FalRequest<Seedance1LiteImageToVideoInput, Seedance1LiteImageToVideoOutput> {
  FalRequest::new("fal-ai/bytedance/seedance/v1/lite/image-to-video", params)
}
