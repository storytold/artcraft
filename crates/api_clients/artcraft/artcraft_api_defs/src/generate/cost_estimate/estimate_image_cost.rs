use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_image_model::CommonImageModel;
use enums::common::generation::common_video_resolution::CommonVideoResolution;
use enums::common::generation_provider::GenerationProvider;

pub const ESTIMATE_IMAGE_COST_PATH: &str = "/v1/generate/cost_estimate/image";

/// Request body for the image cost estimate endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct EstimateImageCostRequest {
  /// The image model to estimate costs for.
  pub model: CommonImageModel,

  /// The provider to route the generation through.
  pub provider: GenerationProvider,

  /// The type of generation (determines whether input images are involved).
  /// This is a tagged enum, so it looks like:
  ///   "generation_mode": {"type": "text_to_image"}
  ///   "generation_mode": {"type": "image_edit", "count": 2}
  pub generation_mode: GenerationMode,

  /// Optional aspect ratio.
  pub aspect_ratio: Option<CommonAspectRatio>,

  /// Optional resolution.
  pub resolution: Option<CommonVideoResolution>,

  /// Number of images to generate in parallel.
  pub image_batch_count: Option<u16>,
}

/// Describes the type of image generation being requested.
#[derive(Serialize, Deserialize, ToSchema)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum GenerationMode {
  /// No input images — generate from prompt only.
  TextToImage,
  /// One or more input images are provided for editing/compositing.
  ImageEdit { count: u32 },
}

/// Response body for the image cost estimate endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct EstimateImageCostResponse {
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

/// Error response for the image cost estimate endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct EstimateImageCostError {
  pub success: bool,
  pub error_type: EstimateImageCostErrorType,
  pub error_message: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum EstimateImageCostErrorType {
  InvalidProviderForModel,
  InvalidInput,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_serialization_text_to_image() {
    let request = EstimateImageCostRequest {
      model: CommonImageModel::NanaBananaPro,
      provider: GenerationProvider::Artcraft,
      generation_mode: GenerationMode::TextToImage,
      aspect_ratio: None,
      resolution: None,
      image_batch_count: None,
    };
    let serialized = serde_json::to_string(&request).unwrap();
    assert!(serialized.contains("\"generation_mode\":{\"type\":\"text_to_image\"}"));
  }

  #[test]
  fn test_serialization_image_edit() {
    let request = EstimateImageCostRequest {
      model: CommonImageModel::NanaBananaPro,
      provider: GenerationProvider::Artcraft,
      generation_mode: GenerationMode::ImageEdit { count: 2 },
      aspect_ratio: None,
      resolution: None,
      image_batch_count: None,
    };
    let serialized = serde_json::to_string(&request).unwrap();
    assert!(serialized.contains("\"generation_mode\":{\"type\":\"image_edit\",\"count\":2}"));
  }
}
