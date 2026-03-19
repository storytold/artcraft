use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KlingV2p1MasterImageToVideoInput {
  pub image_url: String,

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

  #[serde(skip_serializing_if = "Option::is_none")]
  pub tail_image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV2p1MasterImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV2p1MasterImageToVideoOutput {
  pub video: KlingV2p1MasterImageToVideoVideoFile,
}

pub fn kling_v2p1_master_image_to_video(
  params: KlingV2p1MasterImageToVideoInput,
) -> FalRequest<KlingV2p1MasterImageToVideoInput, KlingV2p1MasterImageToVideoOutput> {
  FalRequest::new("fal-ai/kling-video/v2.1/master/image-to-video", params)
}
