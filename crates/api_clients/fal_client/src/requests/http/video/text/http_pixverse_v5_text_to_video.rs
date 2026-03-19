use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PixverseV5TextToVideoInput {
  pub prompt: String,

  /// Options: "360p", "540p", "720p", "1080p"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Options: "16:9", "4:3", "1:1", "3:4", "9:16"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Optional negative prompt
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Duration in seconds
  /// Options: "5", "8"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Options: "anime", "3d_animation", "clay", "comic", "cyberpunk"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub style: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PixverseV5TextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PixverseV5TextToVideoOutput {
  pub video: PixverseV5TextToVideoVideoFile,
}

pub fn pixverse_v5_text_to_video(
  params: PixverseV5TextToVideoInput,
) -> FalRequest<PixverseV5TextToVideoInput, PixverseV5TextToVideoOutput> {
  FalRequest::new("fal-ai/pixverse/v5/text-to-video", params)
}
