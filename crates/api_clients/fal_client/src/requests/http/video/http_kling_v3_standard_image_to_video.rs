use fal::request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KlingV3StandardImageToVideoInput {
  pub prompt: String,

  /// Starting frame image URL
  pub image_url: String,

  /// Optional end frame image URL
  #[serde(skip_serializing_if = "Option::is_none")]
  pub end_image_url: Option<String>,

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
pub struct KlingV3StandardImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV3StandardImageToVideoOutput {
  pub video: KlingV3StandardImageToVideoVideoFile,
}

pub fn kling_v3_standard_image_to_video(
  params: KlingV3StandardImageToVideoInput,
) -> FalRequest<KlingV3StandardImageToVideoInput, KlingV3StandardImageToVideoOutput> {
  FalRequest::new("fal-ai/kling-video/v3/standard/image-to-video", params)
}
