use artcraft_router::api::provider::Provider;
use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use artcraft_router::generate::generate_video::generate_video_request::GenerateVideoRequest;
use artcraft_router::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use log::warn;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

/// Estimate costs for a video generation request.
/// Prefers the Artcraft provider for costing, but falls back to Fal for models
/// that are only available via Fal (e.g. Veo).
pub fn request_to_costs(
  request: &GenerateVideoRequest<'_>,
) -> Result<VideoGenerationCostEstimate, AdvancedCommonWebError> {
  let artcraft_request = GenerateVideoRequest {
    provider: Provider::Artcraft,
    ..*request
  };

  match artcraft_request.build() {
    Ok(plan) => Ok(plan.estimate_costs()),
    Err(ArtcraftRouterError::UnsupportedModel(_)) => {
      let fal_request = GenerateVideoRequest {
        provider: Provider::Fal,
        ..*request
      };
      let plan = fal_request.build()
        .map_err(|e| {
          warn!("Failed to build Fal cost plan: {}", e);
          AdvancedCommonWebError::from_error(e)
        })?;
      Ok(plan.estimate_costs())
    }
    Err(e) => {
      warn!("Failed to build cost plan: {}", e);
      Err(AdvancedCommonWebError::from_error(e))
    }
  }
}
