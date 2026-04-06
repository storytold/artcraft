use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_image::generate_image_request::GenerateImageRequest;
use artcraft_router::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use log::warn;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

/// Build the Artcraft-provider cost plan for this request.
pub fn request_to_costs(
  request: &mut GenerateImageRequest<'_>,
) -> Result<ImageGenerationCostEstimate, AdvancedCommonWebError> {
  request.provider = Provider::Artcraft;

  let plan = request.build()
    .map_err(|e| {
      warn!("Failed to build cost plan: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;

  Ok(plan.estimate_costs())
}
