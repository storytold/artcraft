use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_response::omni_gen_image_cost_response::OmniGenImageCostResponse;
use artcraft_router::api::provider::Provider;
use log::warn;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::omni_gen::generate::image::transform_request::transform_request;
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
) -> Result<Json<OmniGenImageCostResponse>, AdvancedCommonWebError> {
  let mut generate_request = transform_request(&request)?;
  generate_request.provider = Provider::Artcraft;

  let plan = generate_request.build()
    .map_err(|e| {
      warn!("Failed to build cost plan: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;

  let estimate = plan.estimate_costs();

  Ok(Json(OmniGenImageCostResponse {
    success: true,
    cost_in_credits: estimate.cost_in_credits,
    cost_in_usd_cents: estimate.cost_in_usd_cents,
    is_free: estimate.is_free,
    is_unlimited: estimate.is_unlimited,
    is_rate_limited: estimate.is_rate_limited,
    has_watermark: estimate.has_watermark,
  }))
}
