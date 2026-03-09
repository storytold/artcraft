use std::fmt::{Display, Formatter};

use actix_http::StatusCode;
use actix_web::web::Json;
use actix_web::{HttpResponse, ResponseError};
use artcraft_api_defs::generate::cost_estimate::estimate_splat_cost::{
  EstimateSplatCostError, EstimateSplatCostErrorType, EstimateSplatCostRequest,
  EstimateSplatCostResponse,
};
use artcraft_router::api::common_splat_model::CommonSplatModel as RouterSplatModel;
use artcraft_router::api::provider::Provider as RouterProvider;
use artcraft_router::generate::generate_splat::generate_splat_request::GenerateSplatRequest;
use enums::common::generation::common_splat_model::CommonSplatModel;
use enums::common::generation_provider::GenerationProvider;


/// Estimate the credit and USD cost of a splat generation request.
/// Does not require authentication and does not charge any credits.
#[utoipa::path(
  post,
  tag = "Cost Estimate",
  path = "/v1/generate/cost_estimate/splat",
  responses(
    (status = 200, description = "Cost estimate", body = EstimateSplatCostResponse),
    (status = 400, description = "Invalid request", body = EstimateSplatCostError),
  ),
)]
pub async fn estimate_splat_cost_handler(
  request: Json<EstimateSplatCostRequest>,
) -> Result<Json<EstimateSplatCostResponse>, HandlerError> {
  let router_provider = map_provider(request.provider, request.model)?;
  let router_model = map_splat_model(request.model);

  let router_request = GenerateSplatRequest {
    model: router_model,
    provider: router_provider,
    prompt: None,
    reference_images: if request.has_reference_image.unwrap_or(false) {
      // NB: The cost estimation only cares whether a reference image is present,
      // not the actual image data. We pass None here; the plan will detect
      // "has reference image" from the model's cost function.
      // However, the build() path requires no images to estimate cost.
      None
    } else {
      None
    },
    idempotency_token: None,
  };

  let plan = router_request.build()
    .map_err(|e| HandlerError::InvalidInput(format!("{}", e)))?;

  let estimate = plan.estimate_costs();

  Ok(Json(EstimateSplatCostResponse {
    success: true,
    cost_in_credits: estimate.cost_in_credits,
    cost_in_usd_cents: estimate.cost_in_usd_cents,
    is_free: estimate.is_free,
    is_unlimited: estimate.is_unlimited,
    is_rate_limited: estimate.is_rate_limited,
    has_watermark: estimate.has_watermark,
  }))
}

/// Local error type — wraps the serializable API error struct so we can implement
/// ResponseError (orphan rules prevent implementing it directly on the foreign type).
#[derive(Debug)]
pub enum HandlerError {
  InvalidProviderForModel { provider: String, model: String },
  InvalidInput(String),
}

impl std::error::Error for HandlerError {}

impl Display for HandlerError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl ResponseError for HandlerError {
  fn status_code(&self) -> StatusCode {
    StatusCode::BAD_REQUEST
  }

  fn error_response(&self) -> HttpResponse {
    let (error_type, error_message) = match self {
      HandlerError::InvalidProviderForModel { provider, model } => (
        EstimateSplatCostErrorType::InvalidProviderForModel,
        format!("Provider '{}' is not supported for model '{}'", provider, model),
      ),
      HandlerError::InvalidInput(msg) => (
        EstimateSplatCostErrorType::InvalidInput,
        msg.clone(),
      ),
    };
    HttpResponse::BadRequest().json(EstimateSplatCostError {
      success: false,
      error_type,
      error_message,
    })
  }
}

fn map_provider(
  provider: GenerationProvider,
  model: CommonSplatModel,
) -> Result<RouterProvider, HandlerError> {
  match provider {
    GenerationProvider::Artcraft => Ok(RouterProvider::Artcraft),
    other => Err(HandlerError::InvalidProviderForModel {
      provider: format!("{:?}", other),
      model: format!("{:?}", model),
    }),
  }
}

fn map_splat_model(model: CommonSplatModel) -> RouterSplatModel {
  match model {
    CommonSplatModel::Marble0p1Mini => RouterSplatModel::Marble0p1Mini,
    CommonSplatModel::Marble0p1Plus => RouterSplatModel::Marble0p1Plus,
  }
}
