use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::hydrate_router_request::hydrate_to_router_request;
use crate::http_server::endpoints::omni_gen::shared_utils::video::validate_video_request::validate_video_request;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_response::omni_gen_video_cost_response::OmniGenVideoCostResponse;
use artcraft_router::api::router_provider::RouterProvider;
use log::warn;

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
) -> Result<Json<OmniGenVideoCostResponse>, CommonWebError> {
  validate_video_request(&request)?;

  let mut builder = hydrate_to_router_request(&request)?;

  builder.provider = RouterProvider::Artcraft;

  let estimate = builder.build2()
    .map_err(|e| {
      warn!("Failed to build cost estimate: {}", e);
      CommonWebError::from_error(e)
    })?
    .estimate_cost()
    .map_err(|e| {
      warn!("Failed to estimate cost: {}", e);
      CommonWebError::from_error(e)
    })?;

  Ok(Json(OmniGenVideoCostResponse {
    success: true,
    cost_in_credits: estimate.cost_in_credits,
    cost_in_usd_cents: estimate.cost_in_usd_cents,
    is_free: estimate.is_free,
    is_unlimited: estimate.is_unlimited,
    is_rate_limited: estimate.is_rate_limited,
    has_watermark: estimate.has_watermark,
    failures_are_refunded: estimate.failures_are_refunded,
  }))
}
