use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::common_video_resolution::CommonVideoResolution;
use enums::common::generation_provider::GenerationProvider;

pub const ESTIMATE_VIDEO_COST_PATH: &str = "/v1/generate/cost_estimate/video";

/// Request body for the video cost estimate endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct EstimateVideoCostRequest {
  /// The video model to estimate costs for.
  pub model: CommonVideoModel,

  /// The provider to route the generation through.
  pub provider: GenerationProvider,

  /// The type of generation (determines how many input images are involved).
  /// This is a tagged enum, so it looks like:
  ///   "generation_mode": {"type": "text_to_video"}
  ///   "generation_mode": {"type": "reference_image_to_video", "count": 1}
  pub generation_mode: GenerationMode,

  /// Optional aspect ratio.
  pub aspect_ratio: Option<CommonAspectRatio>,

  /// Optional resolution.
  pub resolution: Option<CommonVideoResolution>,

  /// Duration in seconds.
  pub duration_seconds: Option<u16>,

  /// Number of videos to generate in parallel.
  pub video_batch_count: Option<u16>,
}

/// Describes the type of video generation being requested.
#[derive(Serialize, Deserialize, ToSchema)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum GenerationMode {
  TextToVideo,
  StartFrameToVideo,
  StartAndEndFrameToVideo,
  ReferenceImageToVideo { count: u32 },
}

/// Response body for the video cost estimate endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct EstimateVideoCostResponse {
  pub success: bool,

  /// Estimated cost in credits.
  pub cost_in_credits: Option<u64>,

  /// Estimated cost in USD cents.
  pub cost_in_usd_cents: Option<u64>,

  /// Whether the generation is free for this user/plan.
  pub is_free: bool,

  /// Whether the user has unlimited generations.
  pub is_unlimited: bool,

  /// Whether the user is rate limited.
  pub is_rate_limited: bool,

  /// Whether the output will have a watermark.
  pub has_watermark: bool,
}

/// Error response for the video cost estimate endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct EstimateVideoCostError {
  pub success: bool,
  pub error_type: EstimateVideoCostErrorType,
  pub error_message: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum EstimateVideoCostErrorType {
  InvalidProviderForModel,
  InvalidInput,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_serialization_tagging1() {
    let request = EstimateVideoCostRequest {
      model: CommonVideoModel::GrokVideo,
      provider: GenerationProvider::Artcraft,
      generation_mode: GenerationMode::TextToVideo,
      aspect_ratio: None,
      resolution: None,
      duration_seconds: None,
      video_batch_count: None,
    };
    let serialized = serde_json::to_string(&request).unwrap();
    assert!(serialized.contains("\"generation_mode\":{\"type\":\"text_to_video\"}"));
    //assert_eq!(serialized, "{}");
  }

  #[test]
  fn test_serialization_tagging2() {
    let request = EstimateVideoCostRequest {
      model: CommonVideoModel::GrokVideo,
      provider: GenerationProvider::Artcraft,
      generation_mode: GenerationMode::ReferenceImageToVideo { count: 1 },
      aspect_ratio: None,
      resolution: None,
      duration_seconds: None,
      video_batch_count: None,
    };
    let serialized = serde_json::to_string(&request).unwrap();
    assert!(serialized.contains("\"generation_mode\":{\"type\":\"reference_image_to_video\",\"count\":1}"));
  }
}
