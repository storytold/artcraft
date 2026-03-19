use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HailuoV2p3ProTextToVideoInput {
  pub prompt: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub prompt_optimizer: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HailuoV2p3ProTextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HailuoV2p3ProTextToVideoOutput {
  pub video: HailuoV2p3ProTextToVideoVideoFile,
}

pub fn hailuo_v2p3_pro_text_to_video(
  params: HailuoV2p3ProTextToVideoInput,
) -> FalRequest<HailuoV2p3ProTextToVideoInput, HailuoV2p3ProTextToVideoOutput> {
  FalRequest::new("fal-ai/minimax/hailuo-2.3/pro/text-to-video", params)
}
