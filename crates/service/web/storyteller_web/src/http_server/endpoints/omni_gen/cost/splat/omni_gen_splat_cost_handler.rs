use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_splat_cost_and_generate_request::OmniGenSplatCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_response::omni_gen_splat_cost_response::OmniGenSplatCostResponse;
use artcraft_router::api::router_provider::RouterProvider;
use log::warn;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_gen::generate::splat::helpers::hydrate_router_request::hydrate_to_router_request;
use crate::http_server::endpoints::omni_gen::shared_utils::splat::validate_splat_request::validate_splat_request;
use crate::state::server_state::ServerState;

/// Estimate the cost of a splat (3D world) generation.
#[utoipa::path(
  post,
  tag = "Omni Gen",
  path = "/v1/omni_gen/cost/splat",
  request_body = OmniGenSplatCostAndGenerateRequest,
  responses(
    (status = 200, description = "Success", body = OmniGenSplatCostResponse),
    (status = 400, description = "Bad input"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_splat_cost_handler(
  _http_request: HttpRequest,
  request: Json<OmniGenSplatCostAndGenerateRequest>,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenSplatCostResponse>, CommonWebError> {
  validate_splat_request(&request)?;

  let mut builder = hydrate_to_router_request(&request)?;

  builder.provider = RouterProvider::Artcraft;

  let estimate = builder.build2()
    .map_err(|e| {
      warn!("Failed to build splat cost estimate: {}", e);
      CommonWebError::from_error(e)
    })?
    .estimate_cost()
    .map_err(|e| {
      warn!("Failed to estimate splat cost: {}", e);
      CommonWebError::from_error(e)
    })?;

  Ok(Json(OmniGenSplatCostResponse {
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
