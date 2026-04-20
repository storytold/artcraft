use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_1_6_pro::{optional_url, require_url};
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use fal_client::requests::webhook::video::image::enqueue_kling_v2p1_pro_image_to_video_webhook::{
  Kling2p1ProAspectRatio, Kling2p1ProDuration,
};

#[derive(Debug, Clone)]
pub struct PlanFalKling21Pro {
  pub prompt: String,
  pub image_url: String,
  pub end_image_url: Option<String>,
  pub aspect_ratio: Kling2p1ProAspectRatio,
  pub duration: Kling2p1ProDuration,
}

pub fn plan_generate_video_fal_kling_2_1_pro(
  request: &GenerateVideoRequestBuilder,
) -> Result<VideoGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let image_url = require_url(request.start_frame.clone(), "start_frame", "Kling 2.1 Pro requires a starting frame")?;
  let end_image_url = optional_url(request.end_frame.clone())?;
  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::FalKling21Pro(PlanFalKling21Pro {
    prompt: request.prompt.clone().unwrap_or_default(),
    image_url,
    end_image_url,
    aspect_ratio,
    duration,
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Kling2p1ProAspectRatio, ArtcraftRouterError> {
  use Kling2p1ProAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(Ar::WideSixteenNine),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Ar::Square),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Ar::WideSixteenNine),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Ar::TallNineSixteen),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Ar::WideSixteenNine),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Ar::WideSixteenNine),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Kling2p1ProDuration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Kling2p1ProDuration::Default),
    Some(5) => Ok(Kling2p1ProDuration::FiveSeconds),
    Some(10) => Ok(Kling2p1ProDuration::TenSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Kling2p1ProDuration::TenSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Kling2p1ProDuration::FiveSeconds),
    },
  }
}

impl PlanFalKling21Pro {
  pub fn is_ten_seconds(&self) -> bool {
    matches!(self.duration, Kling2p1ProDuration::TenSeconds)
  }
}
