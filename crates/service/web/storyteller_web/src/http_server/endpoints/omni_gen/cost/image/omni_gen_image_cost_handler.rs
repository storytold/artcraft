use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_response::omni_gen_image_cost_response::OmniGenImageCostResponse;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use artcraft_router::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use log::warn;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_gen::generate::image::hydrate_to_router_request::hydrate_to_router_request;
use crate::state::server_state::ServerState;

/// Estimate the cost of an image generation.
#[utoipa::path(
  post,
  tag = "Omni Gen",
  path = "/v1/omni_gen/cost/image",
  request_body = OmniGenImageCostAndGenerateRequest,
  responses(
    (status = 200, description = "Success", body = OmniGenImageCostResponse),
    (status = 400, description = "Bad input"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_image_cost_handler(
  _http_request: HttpRequest,
  request: Json<OmniGenImageCostAndGenerateRequest>,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenImageCostResponse>, CommonWebError> {
  let mut builder = hydrate_to_router_request(&request)?;

  builder.provider = Provider::Artcraft; // NB: Explicitly spell this out.

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

  Ok(Json(OmniGenImageCostResponse {
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
