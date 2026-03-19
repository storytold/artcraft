use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KlingV2p5TurboProTextToVideoInput {
  pub prompt: String,

  /// Possible enum values: "16:9", "9:16", "1:1"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Optional negative prompt
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Duration in seconds
  /// Options: "5", "10"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// The CFG (Classifier Free Guidance) scale.
  /// Default value: 0.5
  #[serde(skip_serializing_if = "Option::is_none")]
  pub cfg_scale: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV2p5TurboProTextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV2p5TurboProTextToVideoOutput {
  pub video: KlingV2p5TurboProTextToVideoVideoFile,
}

pub fn kling_v2p5_turbo_pro_text_to_video(
  params: KlingV2p5TurboProTextToVideoInput,
) -> FalRequest<KlingV2p5TurboProTextToVideoInput, KlingV2p5TurboProTextToVideoOutput> {
  FalRequest::new("fal-ai/kling-video/v2.5-turbo/pro/text-to-video", params)
}
