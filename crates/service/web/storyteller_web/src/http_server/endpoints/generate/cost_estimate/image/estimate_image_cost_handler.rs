use std::fmt::{Display, Formatter};

use actix_http::StatusCode;
use actix_web::web::Json;
use actix_web::{HttpResponse, ResponseError};
use artcraft_api_defs::generate::cost_estimate::estimate_image_cost::{
  EstimateImageCostError, EstimateImageCostErrorType, EstimateImageCostRequest,
  EstimateImageCostResponse,
};
use artcraft_router::api::common_aspect_ratio::CommonAspectRatio as RouterAspectRatio;
use artcraft_router::api::common_image_model::CommonImageModel as RouterImageModel;
use artcraft_router::api::common_resolution::CommonResolution as RouterResolution;
use artcraft_router::api::provider::Provider as RouterProvider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::generate::generate_image::generate_image_request::GenerateImageRequest;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_image_model::CommonImageModel;
use enums::common::generation::common_video_resolution::CommonVideoResolution;
use enums::common::generation_provider::GenerationProvider;

/// Estimate the credit and USD cost of an image generation request.
/// Does not require authentication and does not charge any credits.
#[utoipa::path(
  post,
  tag = "Cost Estimate",
  path = "/v1/generate/cost_estimate/image",
  responses(
    (status = 200, description = "Cost estimate", body = EstimateImageCostResponse),
    (status = 400, description = "Invalid request", body = EstimateImageCostError),
  ),
)]
pub async fn estimate_image_cost_handler(
  request: Json<EstimateImageCostRequest>,
) -> Result<Json<EstimateImageCostResponse>, HandlerError> {
  let router_provider = map_provider(request.provider, request.model)?;
  let router_model = map_image_model(request.model)?;
  let router_aspect_ratio = request.aspect_ratio.map(map_aspect_ratio);
  let router_resolution = request.resolution.map(map_resolution);

  let router_request = GenerateImageRequest {
    model: router_model,
    provider: router_provider,
    prompt: None,
    image_inputs: None,
    resolution: router_resolution,
    aspect_ratio: router_aspect_ratio,
    image_batch_count: request.image_batch_count,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
    idempotency_token: None,
  };

  let plan = router_request.build()
    .map_err(|e| HandlerError::InvalidInput(format!("{}", e)))?;

  let estimate = plan.estimate_costs();

  Ok(Json(EstimateImageCostResponse {
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
        EstimateImageCostErrorType::InvalidProviderForModel,
        format!("Provider '{}' is not supported for model '{}'", provider, model),
      ),
      HandlerError::InvalidInput(msg) => (
        EstimateImageCostErrorType::InvalidInput,
        msg.clone(),
      ),
    };
    HttpResponse::BadRequest().json(EstimateImageCostError {
      success: false,
      error_type,
      error_message,
    })
  }
}

fn map_provider(
  provider: GenerationProvider,
  model: CommonImageModel,
) -> Result<RouterProvider, HandlerError> {
  match provider {
    GenerationProvider::Artcraft => Ok(RouterProvider::Artcraft),
    other => Err(HandlerError::InvalidProviderForModel {
      provider: format!("{:?}", other),
      model: format!("{:?}", model),
    }),
  }
}

fn map_image_model(model: CommonImageModel) -> Result<RouterImageModel, HandlerError> {
  let router_model = match model {
    CommonImageModel::NanaBananaPro => RouterImageModel::NanaBananaPro,
  };
  Ok(router_model)
}

fn map_aspect_ratio(ar: CommonAspectRatio) -> RouterAspectRatio {
  match ar {
    CommonAspectRatio::Auto => RouterAspectRatio::Auto,
    CommonAspectRatio::Square => RouterAspectRatio::Square,
    CommonAspectRatio::WideThreeByTwo => RouterAspectRatio::WideThreeByTwo,
    CommonAspectRatio::WideFourByThree => RouterAspectRatio::WideFourByThree,
    CommonAspectRatio::WideFiveByFour => RouterAspectRatio::WideFiveByFour,
    CommonAspectRatio::WideSixteenByNine => RouterAspectRatio::WideSixteenByNine,
    CommonAspectRatio::WideTwentyOneByNine => RouterAspectRatio::WideTwentyOneByNine,
    CommonAspectRatio::TallTwoByThree => RouterAspectRatio::TallTwoByThree,
    CommonAspectRatio::TallThreeByFour => RouterAspectRatio::TallThreeByFour,
    CommonAspectRatio::TallFourByFive => RouterAspectRatio::TallFourByFive,
    CommonAspectRatio::TallNineBySixteen => RouterAspectRatio::TallNineBySixteen,
    CommonAspectRatio::TallNineByTwentyOne => RouterAspectRatio::TallNineByTwentyOne,
    CommonAspectRatio::Wide => RouterAspectRatio::Wide,
    CommonAspectRatio::Tall => RouterAspectRatio::Tall,
    CommonAspectRatio::Auto2k => RouterAspectRatio::Auto2k,
    CommonAspectRatio::Auto4k => RouterAspectRatio::Auto4k,
    CommonAspectRatio::SquareHd => RouterAspectRatio::SquareHd,
  }
}

fn map_resolution(res: CommonVideoResolution) -> RouterResolution {
  match res {
    CommonVideoResolution::OneK => RouterResolution::OneK,
    CommonVideoResolution::TwoK => RouterResolution::TwoK,
    CommonVideoResolution::ThreeK => RouterResolution::ThreeK,
    CommonVideoResolution::FourK => RouterResolution::FourK,
  }
}
