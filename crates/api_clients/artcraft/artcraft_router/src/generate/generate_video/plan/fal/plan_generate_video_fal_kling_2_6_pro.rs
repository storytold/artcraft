use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_1_6_pro::optional_url;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

#[derive(Debug, Clone, Copy)]
pub enum FalKling2p6ProAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Debug, Clone, Copy)]
pub enum FalKling2p6ProDuration {
  Five,
  Ten,
}

#[derive(Debug, Clone)]
pub enum FalKling2p6ProMode {
  TextToVideo,
  ImageToVideo { image_url: String },
}

#[derive(Debug, Clone)]
pub struct PlanFalKling2p6Pro {
  pub prompt: String,
  pub negative_prompt: Option<String>,
  pub mode: FalKling2p6ProMode,
  pub aspect_ratio: Option<FalKling2p6ProAspectRatio>,
  pub duration: Option<FalKling2p6ProDuration>,
  pub generate_audio: Option<bool>,
}

pub fn plan_generate_video_fal_kling_2_6_pro(
  request: &GenerateVideoRequestBuilder,
) -> Result<VideoGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  if request.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Kling 2.6 Pro does not support an ending frame".to_string(),
    }));
  }

  let mode = match optional_url(request.start_frame.clone())? {
    None => FalKling2p6ProMode::TextToVideo,
    Some(image_url) => FalKling2p6ProMode::ImageToVideo { image_url },
  };

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::FalKling2p6Pro(PlanFalKling2p6Pro {
    prompt: request.prompt.clone().unwrap_or_default(),
    negative_prompt: request.negative_prompt.clone(),
    mode,
    aspect_ratio,
    duration,
    generate_audio: request.generate_audio,
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalKling2p6ProAspectRatio>, ArtcraftRouterError> {
  use FalKling2p6ProAspectRatio as Ar;
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
) -> Result<Option<FalKling2p6ProDuration>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(5) => Ok(Some(FalKling2p6ProDuration::Five)),
    Some(10) => Ok(Some(FalKling2p6ProDuration::Ten)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(FalKling2p6ProDuration::Ten)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(FalKling2p6ProDuration::Five)),
    },
  }
}

impl PlanFalKling2p6Pro {
  pub fn is_ten_seconds(&self) -> bool {
    matches!(self.duration, Some(FalKling2p6ProDuration::Ten))
  }

  /// Legacy / Fal client default for `generate_audio` is `true`.
  pub fn generate_audio_for_cost(&self) -> bool {
    self.generate_audio.unwrap_or(true)
  }
}
