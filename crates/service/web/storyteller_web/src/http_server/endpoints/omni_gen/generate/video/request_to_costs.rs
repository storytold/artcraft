use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use log::warn;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::omni_gen::generate::video::transform_request::transform_request;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;

/// Build the Artcraft-provider cost plan for this request.
pub fn estimate_costs(
  request: &OmniGenVideoCostAndGenerateRequest,
) -> Result<VideoGenerationCostEstimate, AdvancedCommonWebError> {
  let mut generate_request = transform_request(request)?;
  generate_request.provider = Provider::Artcraft;

  let plan = generate_request.build()
    .map_err(|e| {
      warn!("Failed to build cost plan: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;

  Ok(plan.estimate_costs())
}
