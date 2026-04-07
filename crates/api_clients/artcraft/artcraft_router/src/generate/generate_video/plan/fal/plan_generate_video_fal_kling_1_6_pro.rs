use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use fal_client::requests::webhook::video::image::enqueue_kling_v1p6_pro_image_to_video_webhook::{
  Kling1p6ProAspectRatio, Kling1p6ProDuration,
};

#[derive(Debug, Clone)]
pub struct PlanFalKling16Pro {
  pub prompt: String,
  pub image_url: String,
  pub end_image_url: Option<String>,
  pub aspect_ratio: Kling1p6ProAspectRatio,
  pub duration: Kling1p6ProDuration,
}

pub fn plan_generate_video_fal_kling_1_6_pro<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let image_url = require_url(request.start_frame, "start_frame", "Kling 1.6 Pro requires a starting frame")?;
  let end_image_url = optional_url(request.end_frame)?;
  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::FalKling16Pro(PlanFalKling16Pro {
    prompt: request.prompt.unwrap_or("").to_string(),
    image_url,
    end_image_url,
    aspect_ratio,
    duration,
  }))
}

pub(crate) fn require_url(
  image_ref: Option<ImageRef<'_>>,
  field: &'static str,
  reason: &str,
) -> Result<String, ArtcraftRouterError> {
  match image_ref {
    Some(ImageRef::Url(url)) => Ok(url.to_string()),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
    None => Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field,
      value: reason.to_string(),
    })),
  }
}

pub(crate) fn optional_url(
  image_ref: Option<ImageRef<'_>>,
) -> Result<Option<String>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::Url(url)) => Ok(Some(url.to_string())),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Kling1p6ProAspectRatio, ArtcraftRouterError> {
  use Kling1p6ProAspectRatio as Ar;
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
) -> Result<Kling1p6ProDuration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Kling1p6ProDuration::Default),
    Some(5) => Ok(Kling1p6ProDuration::FiveSeconds),
    Some(10) => Ok(Kling1p6ProDuration::TenSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Kling1p6ProDuration::TenSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Kling1p6ProDuration::FiveSeconds),
    },
  }
}

impl PlanFalKling16Pro {
  pub fn is_ten_seconds(&self) -> bool {
    matches!(self.duration, Kling1p6ProDuration::TenSeconds)
  }
}
