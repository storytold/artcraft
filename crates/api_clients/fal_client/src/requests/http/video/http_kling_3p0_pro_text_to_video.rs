use fal::request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Kling3p0ProTextToVideoInput {
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

  /// Shot type for multi-shot video generation.
  /// Possible enum values: "customize", "intelligent"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub shot_type: Option<String>,

  /// The CFG (Classifier Free Guidance) scale.
  /// Default value: 0.5
  #[serde(skip_serializing_if = "Option::is_none")]
  pub cfg_scale: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling3p0ProTextToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling3p0ProTextToVideoOutput {
  pub video: Kling3p0ProTextToVideoVideoFile,
}

pub fn kling_3p0_pro_text_to_video(
  params: Kling3p0ProTextToVideoInput,
) -> FalRequest<Kling3p0ProTextToVideoInput, Kling3p0ProTextToVideoOutput> {
  FalRequest::new("fal-ai/kling-video/v3/pro/text-to-video", params)
}
