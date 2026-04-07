use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_1_6_pro::require_url;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use fal_client::requests::webhook::video::image::enqueue_kling_v2p1_master_image_to_video_webhook::{
  Kling2p1MasterAspectRatio, Kling2p1MasterDuration,
};

#[derive(Debug, Clone)]
pub struct PlanFalKling21Master {
  pub prompt: String,
  pub image_url: String,
  pub aspect_ratio: Kling2p1MasterAspectRatio,
  pub duration: Kling2p1MasterDuration,
}

pub fn plan_generate_video_fal_kling_2_1_master<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let image_url = require_url(request.start_frame, "start_frame", "Kling 2.1 Master requires a starting frame")?;
  if request.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Kling 2.1 Master does not support an ending frame".to_string(),
    }));
  }

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::FalKling21Master(PlanFalKling21Master {
    prompt: request.prompt.unwrap_or("").to_string(),
    image_url,
    aspect_ratio,
    duration,
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Kling2p1MasterAspectRatio, ArtcraftRouterError> {
  use Kling2p1MasterAspectRatio as Ar;
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
) -> Result<Kling2p1MasterDuration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Kling2p1MasterDuration::Default),
    Some(5) => Ok(Kling2p1MasterDuration::FiveSeconds),
    Some(10) => Ok(Kling2p1MasterDuration::TenSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Kling2p1MasterDuration::TenSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Kling2p1MasterDuration::FiveSeconds),
    },
  }
}

impl PlanFalKling21Master {
  pub fn is_ten_seconds(&self) -> bool {
    matches!(self.duration, Kling2p1MasterDuration::TenSeconds)
  }
}
