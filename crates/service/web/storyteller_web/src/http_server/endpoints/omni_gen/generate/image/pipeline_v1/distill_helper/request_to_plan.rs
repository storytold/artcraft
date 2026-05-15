use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use log::warn;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

/// Build an image generation plan from a transformed request.
/// Overrides the provider to Fal for execution (costing uses Artcraft separately).
pub fn request_to_plan(
  request: &mut GenerateImageRequestBuilder,
) -> Result<ImageGenerationPlan, AdvancedCommonWebError> {
  request.provider = Provider::Fal;

  request.build()
    .map_err(|e| {
      warn!("Failed to build image generation plan: {}", e);
      AdvancedCommonWebError::from_error(e)
    })
}
