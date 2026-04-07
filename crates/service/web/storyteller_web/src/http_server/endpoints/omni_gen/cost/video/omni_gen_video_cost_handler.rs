use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_response::omni_gen_video_cost_response::OmniGenVideoCostResponse;
use artcraft_router::api::provider::Provider;
use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use log::warn;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::omni_gen::generate::video::transform_request::hydrate_to_router_request;
use crate::state::server_state::ServerState;

/// Estimate the cost of a video generation.
#[utoipa::path(
  post,
  tag = "Omni Gen",
  path = "/v1/omni_gen/cost/video",
  request_body = OmniGenVideoCostAndGenerateRequest,
  responses(
    (status = 200, description = "Success", body = OmniGenVideoCostResponse),
    (status = 400, description = "Bad input"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_video_cost_handler(
  _http_request: HttpRequest,
  request: Json<OmniGenVideoCostAndGenerateRequest>,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenVideoCostResponse>, AdvancedCommonWebError> {
  let mut generate_request = hydrate_to_router_request(&request)?;
  generate_request.provider = Provider::Artcraft;

  let plan = match generate_request.build() {
    Ok(plan) => plan,
    Err(ArtcraftRouterError::UnsupportedModel(_)) => {
      generate_request.provider = Provider::Fal;
      generate_request.build()
        .map_err(|e| {
          warn!("Failed to build Fal cost plan: {}", e);
          AdvancedCommonWebError::from_error(e)
        })?
    }
    Err(e) => {
      warn!("Failed to build cost plan: {}", e);
      return Err(AdvancedCommonWebError::from_error(e));
    }
  };

  let estimate = plan.estimate_costs();

  Ok(Json(OmniGenVideoCostResponse {
    success: true,
    cost_in_credits: estimate.cost_in_credits,
    cost_in_usd_cents: estimate.cost_in_usd_cents,
    is_free: estimate.is_free,
    is_unlimited: estimate.is_unlimited,
    is_rate_limited: estimate.is_rate_limited,
    has_watermark: estimate.has_watermark,
  }))
}
