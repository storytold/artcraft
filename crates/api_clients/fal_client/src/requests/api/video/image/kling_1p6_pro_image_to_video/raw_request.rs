use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/kling-video/v1.6/pro/image-to-video`.
/// xAI's schema: <https://fal.ai/models/fal-ai/kling-video/v1.6/pro/image-to-video/api>
///
/// NB: `tail_image_url` is xAI's name for the end-frame keyframe. Our public
/// API surface (`Kling1p6ProImageToVideoRequest::end_image_url`) uses the
/// `end_image_url` name to match the convention in other Kling modules; we
/// translate at the [`crate::requests::traits::fal_endpoint_trait::FalEndpoint::to_raw_request`]
/// boundary.
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Kling1p6ProImageToVideoInput {
  pub prompt: String,

  /// Starting frame image URL.
  pub image_url: String,

  /// Optional end-frame image URL (the fal schema calls this `tail_image_url`).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub tail_image_url: Option<String>,

  /// Aspect ratio.
  /// Possible values: "16:9", "9:16", "1:1"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Duration in seconds (as a string).
  /// Possible values: "5", "10"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Optional negative prompt.
  /// fal's default: "blur, distort, and low quality"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// The CFG (Classifier Free Guidance) scale.
  /// Default value: 0.5
  #[serde(skip_serializing_if = "Option::is_none")]
  pub cfg_scale: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling1p6ProImageToVideoVideoFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Kling1p6ProImageToVideoOutput {
  pub video: Kling1p6ProImageToVideoVideoFile,
}
