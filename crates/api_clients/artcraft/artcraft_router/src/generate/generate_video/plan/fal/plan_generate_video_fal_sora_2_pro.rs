use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_1_6_pro::optional_url;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

#[derive(Debug, Clone, Copy)]
pub enum FalSora2ProAspectRatio {
  Auto,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Debug, Clone, Copy)]
pub enum FalSora2ProResolution {
  Auto,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Debug, Clone, Copy)]
pub enum FalSora2ProDuration {
  Four,
  Eight,
  Twelve,
}

#[derive(Debug, Clone)]
pub enum FalSora2ProMode {
  TextToVideo,
  ImageToVideo { image_url: String },
}

#[derive(Debug, Clone)]
pub struct PlanFalSora2Pro {
  pub prompt: String,
  pub mode: FalSora2ProMode,
  pub aspect_ratio: Option<FalSora2ProAspectRatio>,
  pub resolution: Option<FalSora2ProResolution>,
  pub duration: Option<FalSora2ProDuration>,
}

pub fn plan_generate_video_fal_sora_2_pro(
  request: &GenerateVideoRequestBuilder,
) -> Result<VideoGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  if request.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Sora 2 Pro does not support an ending frame".to_string(),
    }));
  }

  let mode = match optional_url(request.start_frame.clone())? {
    None => FalSora2ProMode::TextToVideo,
    Some(image_url) => FalSora2ProMode::ImageToVideo { image_url },
  };

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::FalSora2Pro(PlanFalSora2Pro {
    prompt: request.prompt.clone().unwrap_or_default(),
    mode,
    aspect_ratio,
    resolution,
    duration,
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSora2ProAspectRatio>, ArtcraftRouterError> {
  use FalSora2ProAspectRatio as Ar;
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
) -> Result<Option<FalSora2ProResolution>, ArtcraftRouterError> {
  use FalSora2ProResolution as R;
  match resolution {
    None => Ok(None),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(R::SevenTwentyP)),
    Some(CommonResolution::TenEightyP) => Ok(Some(R::TenEightyP)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(R::TenEightyP)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(R::SevenTwentyP)),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSora2ProDuration>, ArtcraftRouterError> {
  use FalSora2ProDuration as D;
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

impl PlanFalSora2Pro {
  /// Fal client default: 4s.
  pub fn duration_seconds_for_cost(&self) -> u64 {
    match self.duration {
      Some(FalSora2ProDuration::Four) | None => 4,
      Some(FalSora2ProDuration::Eight) => 8,
      Some(FalSora2ProDuration::Twelve) => 12,
    }
  }

  /// Fal client default varies by mode: text-to-video defaults to 1080p; image-to-video
  /// defaults to auto (priced as 720p).
  pub fn is_ten_eighty_p_for_cost(&self) -> bool {
    match self.resolution {
      Some(FalSora2ProResolution::TenEightyP) => true,
      Some(FalSora2ProResolution::SevenTwentyP) | Some(FalSora2ProResolution::Auto) => false,
      None => matches!(self.mode, FalSora2ProMode::TextToVideo),
    }
  }
}
