use std::fmt::{Display, Formatter};

use actix_http::StatusCode;
use actix_web::web::Json;
use actix_web::{HttpResponse, ResponseError};
use artcraft_api_defs::generate::cost_estimate::estimate_video_cost::{
  EstimateVideoCostRequest, EstimateVideoCostResponse,
};
use artcraft_router::api::common_aspect_ratio::CommonAspectRatio as RouterAspectRatio;
use artcraft_router::api::common_resolution::CommonVideoResolution as RouterResolution;
use artcraft_router::api::common_video_model::CommonVideoModel as RouterVideoModel;
use artcraft_router::api::provider::Provider as RouterProvider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::generate::generate_video::begin_video_generation::begin_video_generation;
use artcraft_router::generate::generate_video::generate_video_request::GenerateVideoRequest;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::common_video_resolution::CommonVideoResolution;
use enums::common::generation_provider::GenerationProvider;

#[derive(Debug)]
pub enum EstimateVideoCostError {
  InvalidProvider { provider: String, model: String },
  InvalidInput(String),
}

impl std::error::Error for EstimateVideoCostError {}

impl Display for EstimateVideoCostError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[derive(Serialize)]
struct ErrorBody<'a> {
  success: bool,
  error_code: u16,
  error_code_str: Option<&'a str>,
  reason: &'a str,
  message: &'a str,
}

impl ResponseError for EstimateVideoCostError {
  fn status_code(&self) -> StatusCode {
    StatusCode::BAD_REQUEST
  }

  fn error_response(&self) -> HttpResponse {
    let (reason, message) = match self {
      EstimateVideoCostError::InvalidProvider { provider, model } => (
        "invalid_provider",
        format!("Provider '{}' is not supported for model '{}'", provider, model),
      ),
      EstimateVideoCostError::InvalidInput(msg) => (
        "invalid_input",
        msg.clone(),
      ),
    };

    HttpResponse::BadRequest().json(ErrorBody {
      success: false,
      error_code: 400,
      error_code_str: Some("Bad Request"),
      reason,
      message: &message,
    })
  }
}

/// Estimate the credit and USD cost of a video generation request.
/// Does not require authentication and does not charge any credits.
#[utoipa::path(
  post,
  tag = "Cost Estimate",
  path = "/v1/generate/cost_estimate/video",
  responses(
    (status = 200, description = "Cost estimate", body = EstimateVideoCostResponse),
  ),
  params(
    ("request" = EstimateVideoCostRequest, description = "Cost estimate request"),
  )
)]
pub async fn estimate_video_cost_handler(
  request: Json<EstimateVideoCostRequest>,
) -> Result<Json<EstimateVideoCostResponse>, EstimateVideoCostError> {
  let router_provider = map_provider(request.provider, request.model)?;
  let router_model = map_video_model(request.model)?;
  let router_aspect_ratio = request.aspect_ratio.map(map_aspect_ratio);
  let router_resolution = request.resolution.map(map_resolution);

  let router_request = GenerateVideoRequest {
    model: router_model,
    provider: router_provider,
    prompt: None,
    start_frame: None,
    end_frame: None,
    reference_images: None,
    resolution: router_resolution,
    aspect_ratio: router_aspect_ratio,
    duration_seconds: request.duration_seconds.map(|d| d as u16),
    video_batch_count: request.video_batch_count,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
    idempotency_token: None,
  };

  let plan = begin_video_generation(&router_request)
    .map_err(|e| EstimateVideoCostError::InvalidInput(format!("{}", e)))?;

  let cost_in_credits = plan.estimate_costs();

  // 25000 credits = $99.99, so 250 credits ≈ $1.00 → 1 credit ≈ 0.4 cents
  let cost_in_usd_cents = ((cost_in_credits as f64) / 250.0 * 100.0).round() as u64;

  Ok(Json(EstimateVideoCostResponse {
    success: true,
    cost_in_credits: Some(cost_in_credits),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }))
}

fn map_provider(
  provider: GenerationProvider,
  model: CommonVideoModel,
) -> Result<RouterProvider, EstimateVideoCostError> {
  match provider {
    GenerationProvider::Artcraft => Ok(RouterProvider::Artcraft),
    other => Err(EstimateVideoCostError::InvalidProvider {
      provider: format!("{:?}", other),
      model: format!("{:?}", model),
    }),
  }
}

fn map_video_model(model: CommonVideoModel) -> Result<RouterVideoModel, EstimateVideoCostError> {
  let router_model = match model {
    CommonVideoModel::GrokVideo => RouterVideoModel::GrokVideo,
    CommonVideoModel::Kling16Pro => RouterVideoModel::Kling16Pro,
    CommonVideoModel::Kling21Pro => RouterVideoModel::Kling21Pro,
    CommonVideoModel::Kling21Master => RouterVideoModel::Kling21Master,
    CommonVideoModel::Kling2p5TurboPro => RouterVideoModel::Kling2p5TurboPro,
    CommonVideoModel::Kling2p6Pro => RouterVideoModel::Kling2p6Pro,
    CommonVideoModel::Seedance10Lite => RouterVideoModel::Seedance10Lite,
    CommonVideoModel::Seedance2p0 => RouterVideoModel::Seedance2p0,
    CommonVideoModel::Sora2 => RouterVideoModel::Sora2,
    CommonVideoModel::Sora2Pro => RouterVideoModel::Sora2Pro,
    CommonVideoModel::Veo2 => RouterVideoModel::Veo2,
    CommonVideoModel::Veo3 => RouterVideoModel::Veo3,
    CommonVideoModel::Veo3Fast => RouterVideoModel::Veo3Fast,
    CommonVideoModel::Veo3p1 => RouterVideoModel::Veo3p1,
    CommonVideoModel::Veo3p1Fast => RouterVideoModel::Veo3p1Fast,
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
