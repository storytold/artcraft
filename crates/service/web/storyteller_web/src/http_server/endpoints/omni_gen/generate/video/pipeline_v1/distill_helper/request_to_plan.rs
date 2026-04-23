use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use log::warn;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

/// Build a video generation plan from a transformed request.
/// Overrides the provider to Fal for execution (costing uses Artcraft separately).
pub fn request_to_plan(
  request: &mut GenerateVideoRequestBuilder,
) -> Result<VideoGenerationPlan, AdvancedCommonWebError> {
  request.provider = Provider::Fal;

  request.build()
    .map_err(|e| {
      warn!("Failed to build video generation plan: {}", e);
      AdvancedCommonWebError::from_error(e)
    })
}
