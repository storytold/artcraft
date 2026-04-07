use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_1_6_pro::optional_url;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

#[derive(Debug, Clone, Copy)]
pub enum FalKling2p5TurboProAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Debug, Clone, Copy)]
pub enum FalKling2p5TurboProDuration {
  Five,
  Ten,
}

#[derive(Debug, Clone)]
pub enum FalKling2p5TurboProMode {
  TextToVideo,
  ImageToVideo {
    image_url: String,
    end_image_url: Option<String>,
  },
}

#[derive(Debug, Clone)]
pub struct PlanFalKling2p5TurboPro {
  pub prompt: String,
  pub negative_prompt: Option<String>,
  pub mode: FalKling2p5TurboProMode,
  pub aspect_ratio: Option<FalKling2p5TurboProAspectRatio>,
  pub duration: Option<FalKling2p5TurboProDuration>,
}

pub fn plan_generate_video_fal_kling_2_5_turbo_pro<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let mode = match optional_url(request.start_frame)? {
    None => {
      if request.end_frame.is_some() {
        return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "end_frame",
          value: "Kling 2.5 Turbo Pro requires a start_frame when end_frame is provided".to_string(),
        }));
      }
      FalKling2p5TurboProMode::TextToVideo
    }
    Some(image_url) => FalKling2p5TurboProMode::ImageToVideo {
      image_url,
      end_image_url: optional_url(request.end_frame)?,
    },
  };

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::FalKling2p5TurboPro(PlanFalKling2p5TurboPro {
    prompt: request.prompt.unwrap_or("").to_string(),
    negative_prompt: request.negative_prompt.map(|s| s.to_string()),
    mode,
    aspect_ratio,
    duration,
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalKling2p5TurboProAspectRatio>, ArtcraftRouterError> {
  use FalKling2p5TurboProAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(Ar::Square)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(Ar::SixteenByNine)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(Ar::SixteenByNine)),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalKling2p5TurboProDuration>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(5) => Ok(Some(FalKling2p5TurboProDuration::Five)),
    Some(10) => Ok(Some(FalKling2p5TurboProDuration::Ten)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(FalKling2p5TurboProDuration::Ten)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(FalKling2p5TurboProDuration::Five)),
    },
  }
}

impl PlanFalKling2p5TurboPro {
  pub fn is_ten_seconds(&self) -> bool {
    matches!(self.duration, Some(FalKling2p5TurboProDuration::Ten))
  }
}
