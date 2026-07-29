use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_audio_cost_and_generate_request::OmniGenAudioCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_response::omni_gen_audio_cost_response::OmniGenAudioCostResponse;
use artcraft_router::api::router_provider::RouterProvider;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_gen::shared_utils::map_router_cost_error::map_router_cost_error;
use crate::http_server::endpoints::omni_gen::generate::audio::helpers::hydrate_router_request::hydrate_to_router_request;
use crate::state::server_state::ServerState;

/// Estimate the cost of an audio generation.
#[utoipa::path(
  post,
  tag = "Omni Gen",
  path = "/v1/omni_gen/cost/audio",
  request_body = OmniGenAudioCostAndGenerateRequest,
  responses(
    (status = 200, description = "Success", body = OmniGenAudioCostResponse),
    (status = 400, description = "Bad input"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_audio_cost_handler(
  _http_request: HttpRequest,
  request: Json<OmniGenAudioCostAndGenerateRequest>,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenAudioCostResponse>, CommonWebError> {
  // NB: Deliberately no input validation here. The UI polls this endpoint
  // while the user is still composing the request (no prompt typed, nothing
  // attached), and pricing is a total function of the model and options.
  // Bad requests are rejected by the generate endpoint.
  let mut builder = hydrate_to_router_request(&request)?;

  builder.provider = RouterProvider::Artcraft; // NB: User is paying for ArtCraft credits / generation

  let estimate = builder.build2()
    .map_err(map_router_cost_error)?
    .estimate_cost()
    .map_err(map_router_cost_error)?;

  Ok(Json(OmniGenAudioCostResponse {
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
