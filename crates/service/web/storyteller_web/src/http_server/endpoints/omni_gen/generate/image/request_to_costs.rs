use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_image::generate_image_request::GenerateImageRequest;
use artcraft_router::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use log::warn;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

/// Estimate costs for an image generation request.
/// Always uses the Artcraft provider for costing regardless of the execution provider.
pub fn request_to_costs(
  request: &GenerateImageRequest<'_>,
) -> Result<ImageGenerationCostEstimate, AdvancedCommonWebError> {
  let mut cost_request = GenerateImageRequest {
    provider: Provider::Artcraft,
    ..*request
  };

  let plan = cost_request.build()
    .map_err(|e| {
      warn!("Failed to build cost plan: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;

  Ok(plan.estimate_costs())
}
