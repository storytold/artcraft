use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_video::generate_video_request::GenerateVideoRequest;
use artcraft_router::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use log::warn;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

/// Build the Artcraft-provider cost plan for this request.
pub fn request_to_costs(
  request: &mut GenerateVideoRequest<'_>,
) -> Result<VideoGenerationCostEstimate, AdvancedCommonWebError> {
  request.provider = Provider::Artcraft;

  let plan = request.build()
    .map_err(|e| {
      warn!("Failed to build cost plan: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;

  Ok(plan.estimate_costs())
}
