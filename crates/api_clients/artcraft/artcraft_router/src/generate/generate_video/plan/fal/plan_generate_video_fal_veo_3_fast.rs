use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use fal_client::requests::webhook::video::image::enqueue_veo_3_fast_image_to_video_webhook::{
  Veo3FastDuration, Veo3FastResolution,
};

#[derive(Debug, Clone)]
pub struct PlanFalVeo3Fast {
  pub prompt: String,
  pub start_frame_url: String,
  pub resolution: Veo3FastResolution,
  pub duration: Veo3FastDuration,
  pub generate_audio: bool,
}

pub fn plan_generate_video_fal_veo_3_fast<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame_url = resolve_required_image_url(request.start_frame)?;
  if request.end_frame.is_some() {
    return Err(unsupported("end_frame", "Veo 3 Fast does not support an ending frame"));
  }

  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;
  let generate_audio = request.generate_audio.unwrap_or(true);

  Ok(VideoGenerationPlan::FalVeo3Fast(PlanFalVeo3Fast {
    prompt: request.prompt.unwrap_or("").to_string(),
    start_frame_url,
    resolution,
    duration,
    generate_audio,
  }))
}

fn resolve_required_image_url(
  image_ref: Option<ImageRef<'_>>,
) -> Result<String, ArtcraftRouterError> {
  match image_ref {
    Some(ImageRef::Url(url)) => Ok(url.to_string()),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
    None => Err(unsupported("start_frame", "Veo 3 Fast requires a starting frame")),
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Veo3FastResolution, ArtcraftRouterError> {
  use Veo3FastResolution as R;
  match resolution {
    None => Ok(R::Default),
    Some(CommonResolution::SevenTwentyP) => Ok(R::SevenTwentyP),
    Some(CommonResolution::TenEightyP) => Ok(R::TenEightyP),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("resolution", &format!("{:?}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(R::TenEightyP),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(R::SevenTwentyP),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Veo3FastDuration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Veo3FastDuration::Default),
    Some(4) => Ok(Veo3FastDuration::FourSeconds),
    Some(6) => Ok(Veo3FastDuration::SixSeconds),
    Some(8) => Ok(Veo3FastDuration::EightSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("duration_seconds", &format!("{}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Veo3FastDuration::EightSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Veo3FastDuration::FourSeconds),
    },
  }
}

fn unsupported(field: &'static str, value: &str) -> ArtcraftRouterError {
  ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
    field,
    value: value.to_string(),
  })
}

impl PlanFalVeo3Fast {
  pub fn duration_seconds_for_cost(&self) -> u64 {
    match self.duration {
      Veo3FastDuration::Default | Veo3FastDuration::EightSeconds => 8,
      Veo3FastDuration::SixSeconds => 6,
      Veo3FastDuration::FourSeconds => 4,
    }
  }
}
