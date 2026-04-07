use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_1_6_pro::{optional_url, require_url};
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use fal_client::requests::webhook::video::image::enqueue_seedance_1_lite_image_to_video_webhook::{
  Seedance1LiteAspectRatio, Seedance1LiteDuration, Seedance1LiteResolution,
};

#[derive(Debug, Clone)]
pub struct PlanFalSeedance10Lite {
  pub prompt: String,
  pub image_url: String,
  pub end_image_url: Option<String>,
  pub aspect_ratio: Option<Seedance1LiteAspectRatio>,
  pub resolution: Seedance1LiteResolution,
  pub duration: Seedance1LiteDuration,
}

pub fn plan_generate_video_fal_seedance_1_0_lite<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let image_url = require_url(
    request.start_frame,
    "start_frame",
    "Seedance 1.0 Lite requires a starting frame",
  )?;
  let end_image_url = optional_url(request.end_frame)?;
  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::FalSeedance10Lite(PlanFalSeedance10Lite {
    prompt: request.prompt.unwrap_or("").to_string(),
    image_url,
    end_image_url,
    aspect_ratio,
    resolution,
    duration,
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance1LiteAspectRatio>, ArtcraftRouterError> {
  use Seedance1LiteAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(Ar::Auto)),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(Ar::Square)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(Ar::FourByThree)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(Ar::TwentyOneByNine)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(Ar::ThreeByFour)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(Ar::Auto)),
    },
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Seedance1LiteResolution, ArtcraftRouterError> {
  use Seedance1LiteResolution as R;
  match resolution {
    None => Ok(R::SevenTwentyP),
    Some(CommonResolution::FourEightyP) => Ok(R::FourEightyP),
    Some(CommonResolution::SevenTwentyP) => Ok(R::SevenTwentyP),
    Some(CommonResolution::TenEightyP) => Ok(R::TenEightyP),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(R::TenEightyP),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(R::FourEightyP),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Seedance1LiteDuration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Seedance1LiteDuration::FiveSeconds),
    Some(5) => Ok(Seedance1LiteDuration::FiveSeconds),
    Some(10) => Ok(Seedance1LiteDuration::TenSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Seedance1LiteDuration::TenSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Seedance1LiteDuration::FiveSeconds),
    },
  }
}
