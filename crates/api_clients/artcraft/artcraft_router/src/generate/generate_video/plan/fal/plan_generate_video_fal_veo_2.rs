use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use fal_client::requests::webhook::video::image::enqueue_veo_2_image_to_video_webhook::{
  Veo2AspectRatio, Veo2Duration,
};

#[derive(Debug, Clone)]
pub struct PlanFalVeo2 {
  pub prompt: String,
  pub start_frame_url: String,
  pub aspect_ratio: Veo2AspectRatio,
  pub duration: Veo2Duration,
}

pub fn plan_generate_video_fal_veo_2<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame_url = resolve_required_image_url(request.start_frame, "start_frame")?;
  if request.end_frame.is_some() {
    return Err(unsupported("end_frame", "Veo 2 does not support an ending frame"));
  }

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::FalVeo2(PlanFalVeo2 {
    prompt: request.prompt.unwrap_or("").to_string(),
    start_frame_url,
    aspect_ratio,
    duration,
  }))
}

fn resolve_required_image_url(
  image_ref: Option<ImageRef<'_>>,
  field: &'static str,
) -> Result<String, ArtcraftRouterError> {
  match image_ref {
    Some(ImageRef::Url(url)) => Ok(url.to_string()),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
    None => Err(unsupported(field, "Veo 2 requires a starting frame")),
  }
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Veo2AspectRatio, ArtcraftRouterError> {
  use Veo2AspectRatio as Ar;
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Ar::Auto),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Ar::WideSixteenNine),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Ar::TallNineSixteen),

    Some(unsupported_ar) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", unsupported_ar)))
      }
      _ => Ok(Ar::Auto),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Veo2Duration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Veo2Duration::Default),
    Some(5) => Ok(Veo2Duration::FiveSeconds),
    Some(6) => Ok(Veo2Duration::SixSeconds),
    Some(7) => Ok(Veo2Duration::SevenSeconds),
    Some(8) => Ok(Veo2Duration::EightSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("duration_seconds", &format!("{}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Veo2Duration::EightSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Veo2Duration::FiveSeconds),
    },
  }
}

fn unsupported(field: &'static str, value: &str) -> ArtcraftRouterError {
  ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
    field,
    value: value.to_string(),
  })
}

impl PlanFalVeo2 {
  pub fn duration_seconds_for_cost(&self) -> u64 {
    match self.duration {
      Veo2Duration::Default | Veo2Duration::FiveSeconds => 5,
      Veo2Duration::SixSeconds => 6,
      Veo2Duration::SevenSeconds => 7,
      Veo2Duration::EightSeconds => 8,
    }
  }
}
