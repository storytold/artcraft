use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HailuoV2p3FastProImageToVideoInput {
  pub prompt: String,

  pub image_url: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub prompt_optimizer: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HailuoV2p3FastProImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HailuoV2p3FastProImageToVideoOutput {
  pub video: HailuoV2p3FastProImageToVideoVideoFile,
}

pub fn hailuo_v2p3_fast_pro_image_to_video(
  params: HailuoV2p3FastProImageToVideoInput,
) -> FalRequest<HailuoV2p3FastProImageToVideoInput, HailuoV2p3FastProImageToVideoOutput> {
  FalRequest::new("fal-ai/minimax/hailuo-2.3-fast/pro/image-to-video", params)
}
