use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use fal_client::requests::webhook::video::image::enqueue_veo_3_image_to_video_webhook::{
  Veo3I2vAspectRatio, Veo3I2vDuration, Veo3I2vResolution,
};
use fal_client::requests::webhook::video::text::enqueue_veo_3_text_to_video_webhook::{
  Veo3T2vAspectRatio, Veo3T2vDuration, Veo3T2vResolution,
};

#[derive(Debug, Clone)]
pub enum FalVeo3Mode {
  TextToVideo,
  ImageToVideo {
    image_url: String,
  },
}

/// Router-level duration shared between both modes.
#[derive(Debug, Clone, Copy)]
pub enum FalVeo3Duration {
  Default,
  FourSeconds,
  SixSeconds,
  EightSeconds,
}

/// Router-level resolution shared between both modes.
#[derive(Debug, Clone, Copy)]
pub enum FalVeo3Resolution {
  Default,
  SevenTwentyP,
  TenEightyP,
}

/// Router-level aspect ratio for text-to-video only (no Auto, no Square).
#[derive(Debug, Clone, Copy)]
pub enum FalVeo3T2vAspectRatio {
  Default,
  WideSixteenNine,
  TallNineSixteen,
}

/// Router-level aspect ratio for image-to-video only (has Auto, no Square).
#[derive(Debug, Clone, Copy)]
pub enum FalVeo3I2vAspectRatio {
  Auto,
  WideSixteenNine,
  TallNineSixteen,
}

#[derive(Debug, Clone)]
pub struct PlanFalVeo3 {
  pub prompt: String,
  pub negative_prompt: Option<String>,
  pub mode: FalVeo3Mode,
  /// Only set for text-to-video. Image-to-video inherits the source frame's
  /// aspect ratio and uses `i2v_aspect_ratio` instead.
  pub t2v_aspect_ratio: Option<FalVeo3T2vAspectRatio>,
  /// Only set for image-to-video.
  pub i2v_aspect_ratio: Option<FalVeo3I2vAspectRatio>,
  pub resolution: FalVeo3Resolution,
  pub duration: FalVeo3Duration,
  pub generate_audio: bool,
}

pub fn plan_generate_video_fal_veo_3<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  if request.end_frame.is_some() {
    return Err(unsupported("end_frame", "Veo 3 does not support an ending frame"));
  }

  let mode = match request.start_frame {
    Some(ImageRef::Url(url)) => FalVeo3Mode::ImageToVideo {
      image_url: url.to_string(),
    },
    Some(ImageRef::MediaFileToken(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls));
    }
    None => FalVeo3Mode::TextToVideo,
  };

  let (t2v_aspect_ratio, i2v_aspect_ratio) = match &mode {
    FalVeo3Mode::TextToVideo => {
      (Some(plan_t2v_aspect_ratio(request.aspect_ratio, strategy)?), None)
    }
    FalVeo3Mode::ImageToVideo { .. } => {
      (None, Some(plan_i2v_aspect_ratio(request.aspect_ratio, strategy)?))
    }
  };
  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;
  let generate_audio = request.generate_audio.unwrap_or(true);

  Ok(VideoGenerationPlan::FalVeo3(PlanFalVeo3 {
    prompt: request.prompt.unwrap_or("").to_string(),
    negative_prompt: request.negative_prompt.map(|s| s.to_string()),
    mode,
    t2v_aspect_ratio,
    i2v_aspect_ratio,
    resolution,
    duration,
    generate_audio,
  }))
}

/// Text-to-video: only 16:9 and 9:16 (no Auto, no Square).
fn plan_t2v_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FalVeo3T2vAspectRatio, ArtcraftRouterError> {
  use FalVeo3T2vAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(Ar::Default),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Ar::WideSixteenNine),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Ar::TallNineSixteen),

    // Everything else (Auto*, Square, unsupported) → Default (16:9).
    Some(_) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", aspect_ratio.unwrap())))
      }
      _ => Ok(Ar::Default),
    },
  }
}

/// Image-to-video: Auto, 16:9, 9:16 (no Square).
fn plan_i2v_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FalVeo3I2vAspectRatio, ArtcraftRouterError> {
  use FalVeo3I2vAspectRatio as Ar;
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Ar::Auto),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Ar::WideSixteenNine),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Ar::TallNineSixteen),

    // Everything else (Square, unsupported) → Auto.
    Some(_) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", aspect_ratio.unwrap())))
      }
      _ => Ok(Ar::Auto),
    },
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FalVeo3Resolution, ArtcraftRouterError> {
  use FalVeo3Resolution as R;
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
) -> Result<FalVeo3Duration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(FalVeo3Duration::Default),
    Some(4) => Ok(FalVeo3Duration::FourSeconds),
    Some(6) => Ok(FalVeo3Duration::SixSeconds),
    Some(8) => Ok(FalVeo3Duration::EightSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("duration_seconds", &format!("{}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(FalVeo3Duration::EightSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(FalVeo3Duration::FourSeconds),
    },
  }
}

fn unsupported(field: &'static str, value: &str) -> ArtcraftRouterError {
  ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
    field,
    value: value.to_string(),
  })
}

impl PlanFalVeo3 {
  pub fn duration_seconds_for_cost(&self) -> u64 {
    match self.duration {
      FalVeo3Duration::Default | FalVeo3Duration::EightSeconds => 8,
      FalVeo3Duration::SixSeconds => 6,
      FalVeo3Duration::FourSeconds => 4,
    }
  }
}
