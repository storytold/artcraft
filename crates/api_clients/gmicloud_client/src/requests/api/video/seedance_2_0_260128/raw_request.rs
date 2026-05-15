use serde::{Deserialize, Serialize};

/// The payload sent inside `GmiCloudCreateRequest.payload` for seedance-2-0-260128.
#[derive(Debug, Serialize, Deserialize)]
pub struct Seedance20Payload {
  pub prompt: String,

  /// Duration in seconds, e.g. "5", "10".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Aspect ratio, e.g. "16:9", "9:16", "1:1", "4:3", "3:4", "21:9".
  #[serde(rename = "aspectRatio")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Negative prompt (terms to avoid).
  #[serde(rename = "negativePrompt")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// An image URL for image-to-video generation (start frame).
  #[serde(rename = "startFrameUrl")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub start_frame_url: Option<String>,

  /// Seed for deterministic generation.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<u64>,
}
