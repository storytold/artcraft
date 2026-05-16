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

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
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
) -> Result<Json<OmniGenImageCostResponse>, AdvancedCommonWebError> {
  let mut generate_request = hydrate_to_router_request(&request)?;
  generate_request.provider = Provider::Artcraft; // NB: Explicitly spell this out.

  // TODO(bt,2026-05-15): Get rid of this as soon as we can (there are even worse hacks below).
  let estimate = if should_use_pipeline_v2(&generate_request) {
    estimate_pipeline_v2_cost(&generate_request)?
  } else {
    estimate_pipeline_v1_cost(&generate_request)?
  };

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

fn should_use_pipeline_v2(
  generate_request: &GenerateImageRequestBuilder,
) -> bool {
  // Early migrate anything that uses FAL v2:
  let mut builder = generate_request.clone();
  builder.provider = Provider::Fal;

  if builder.use_new_builder() {
    return true;
  }

  // Fallback
  generate_request.use_new_builder()
}

fn estimate_pipeline_v2_cost(
  generate_request: &GenerateImageRequestBuilder,
) -> Result<ImageGenerationCostEstimate, AdvancedCommonWebError> {
  let mut builder = generate_request.clone();

  builder.provider = Provider::Artcraft;

  match builder.clone().build2() {
    Ok(result) => match result.estimate_cost() {
      Ok(cost) => return Ok(cost),
      Err(err) => {
        warn!("Failed to estimate image cost for pipeline v2 (artcraft): {}", err);
      }
    },
    Err(err) => {
      warn!("Failed to build image cost request for pipeline v2 (artcraft): {}", err);
    }
  }

  // TODO(bt,2026-05-15): This is a horrible hack for models that aren't fully migrated
  //  to pipeline_v2 (don't have artcraft cost calculators). This is an awful hack we need
  //  to kill in the future.

  builder.provider = Provider::Fal;

  // Fal cost estimation doesn't work with media file tokens.
  // We don't need to look them up (though, technically, image size does impact cost with
  // some providers). Let's just fill the list with dummy URLs in that case.
  if let Some(ImageListRef::MediaFileTokens(tokens)) = builder.image_inputs.as_ref() {
    builder.image_inputs = Some(ImageListRef::Urls(vec![
      "https://example.com/image.png".to_string();
      tokens.len()
    ]));
  }

  let mut cost = builder.build2()
    .map_err(|e| {
      warn!("Failed to build image cost request for pipeline v2 (fal): {}", e);
      AdvancedCommonWebError::from_error(e)
    })?
    .estimate_cost()
    .map_err(|e| {
      warn!("Failed to estimate image cost for pipeline v2 (fal): {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;

  cost.cost_in_credits = cost.cost_in_usd_cents;

  Ok(cost)
}

fn estimate_pipeline_v1_cost(
  generate_request: &GenerateImageRequestBuilder,
) -> Result<ImageGenerationCostEstimate, AdvancedCommonWebError> {
  let mut builder = generate_request.clone();
  builder.provider = Provider::Artcraft;

  let plan = builder.build()
    .map_err(|e| {
      warn!("Failed to build image cost plan for pipeline v1: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;

  Ok(plan.estimate_costs())
}
