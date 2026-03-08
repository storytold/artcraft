use fal::request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KlingV3ProTextToVideoInput {
  pub prompt: String,

  /// Aspect ratio
  /// Possible enum values: "16:9", "9:16", "1:1"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Generate audio
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  /// Optional negative prompt
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Duration in seconds
  /// Options: "3" through "15"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// The CFG (Classifier Free Guidance) scale.
  /// Default value: 0.5
  #[serde(skip_serializing_if = "Option::is_none")]
  pub cfg_scale: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV3ProTextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV3ProTextToVideoOutput {
  pub video: KlingV3ProTextToVideoVideoFile,
}

pub fn kling_v3_pro_text_to_video(
  params: KlingV3ProTextToVideoInput,
) -> FalRequest<KlingV3ProTextToVideoInput, KlingV3ProTextToVideoOutput> {
  FalRequest::new("fal-ai/kling-video/v3/pro/text-to-video", params)
}
