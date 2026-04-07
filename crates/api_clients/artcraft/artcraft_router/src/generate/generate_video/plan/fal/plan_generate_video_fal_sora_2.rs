use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_1_6_pro::optional_url;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

#[derive(Debug, Clone, Copy)]
pub enum FalSora2AspectRatio {
  Auto,
  SixteenByNine,
  NineBySixteen,
}

/// Sora 2 supports 720p (and `auto` on image-to-video).
#[derive(Debug, Clone, Copy)]
pub enum FalSora2Resolution {
  Auto,
  SevenTwentyP,
}

#[derive(Debug, Clone, Copy)]
pub enum FalSora2Duration {
  Four,
  Eight,
  Twelve,
}

#[derive(Debug, Clone)]
pub enum FalSora2Mode {
  TextToVideo,
  ImageToVideo { image_url: String },
}

#[derive(Debug, Clone)]
pub struct PlanFalSora2 {
  pub prompt: String,
  pub mode: FalSora2Mode,
  pub aspect_ratio: Option<FalSora2AspectRatio>,
  pub resolution: Option<FalSora2Resolution>,
  pub duration: Option<FalSora2Duration>,
}

pub fn plan_generate_video_fal_sora_2<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  if request.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Sora 2 does not support an ending frame".to_string(),
    }));
  }

  let mode = match optional_url(request.start_frame)? {
    None => FalSora2Mode::TextToVideo,
    Some(image_url) => FalSora2Mode::ImageToVideo { image_url },
  };

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::FalSora2(PlanFalSora2 {
    prompt: request.prompt.unwrap_or("").to_string(),
    mode,
    aspect_ratio,
    resolution,
    duration,
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSora2AspectRatio>, ArtcraftRouterError> {
  use FalSora2AspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(Ar::Auto)),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

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

fn plan_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSora2Resolution>, ArtcraftRouterError> {
  use FalSora2Resolution as R;
  match resolution {
    None => Ok(None),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(R::SevenTwentyP)),
    // Only 720p is supported; everything else falls back or errors.
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", other),
        }))
      }
      _ => Ok(Some(R::SevenTwentyP)),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSora2Duration>, ArtcraftRouterError> {
  use FalSora2Duration as D;
  match duration_seconds {
    None => Ok(None),
    Some(4) => Ok(Some(D::Four)),
    Some(8) => Ok(Some(D::Eight)),
    Some(12) => Ok(Some(D::Twelve)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(D::Twelve)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(D::Four)),
    },
  }
}

impl PlanFalSora2 {
  /// Fal client default: 4s.
  pub fn duration_seconds_for_cost(&self) -> u64 {
    match self.duration {
      Some(FalSora2Duration::Four) | None => 4,
      Some(FalSora2Duration::Eight) => 8,
      Some(FalSora2Duration::Twelve) => 12,
    }
  }
}
