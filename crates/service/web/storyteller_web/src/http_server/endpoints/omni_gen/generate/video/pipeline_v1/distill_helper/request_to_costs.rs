use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use artcraft_router::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use log::warn;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

/// Estimate costs for a video generation request.
/// Always uses the Artcraft provider for costing regardless of the execution provider.
/// (Because we're the ones doing the billing.)
pub fn request_to_costs(
  request: &GenerateVideoRequestBuilder,
) -> Result<VideoGenerationCostEstimate, AdvancedCommonWebError> {
  let cost_request = GenerateVideoRequestBuilder {
    provider: Provider::Artcraft,
    ..(*request).clone()
  };

  let plan = cost_request.build()
    .map_err(|e| {
      warn!("Failed to build cost plan: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;

  Ok(plan.estimate_costs())
}
