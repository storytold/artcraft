use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_1_6_pro::optional_url;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

#[derive(Debug, Clone, Copy)]
pub enum FalKling3p0AspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

/// 3-15 seconds inclusive.
#[derive(Debug, Clone, Copy)]
pub struct FalKling3p0Duration(pub u8);

#[derive(Debug, Clone)]
pub enum FalKling3p0Mode {
  TextToVideo,
  ImageToVideo {
    image_url: String,
    end_image_url: Option<String>,
  },
}

#[derive(Debug, Clone)]
pub struct PlanFalKling3p0Pro {
  pub prompt: String,
  pub negative_prompt: Option<String>,
  pub mode: FalKling3p0Mode,
  pub aspect_ratio: Option<FalKling3p0AspectRatio>,
  pub duration: Option<FalKling3p0Duration>,
  pub generate_audio: Option<bool>,
}

pub fn plan_generate_video_fal_kling_3p0_pro<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let inner = build_kling_3p0_plan(request, "Kling 3.0 Pro")?;
  Ok(VideoGenerationPlan::FalKling3p0Pro(PlanFalKling3p0Pro {
    prompt: inner.prompt,
    negative_prompt: inner.negative_prompt,
    mode: inner.mode,
    aspect_ratio: inner.aspect_ratio,
    duration: inner.duration,
    generate_audio: inner.generate_audio,
  }))
}

pub(crate) struct Kling3p0Common {
  pub prompt: String,
  pub negative_prompt: Option<String>,
  pub mode: FalKling3p0Mode,
  pub aspect_ratio: Option<FalKling3p0AspectRatio>,
  pub duration: Option<FalKling3p0Duration>,
  pub generate_audio: Option<bool>,
}

pub(crate) fn build_kling_3p0_plan<'a>(
  request: &'a GenerateVideoRequest<'a>,
  _model_label: &'static str,
) -> Result<Kling3p0Common, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let mode = match optional_url(request.start_frame)? {
    None => {
      if request.end_frame.is_some() {
        return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "end_frame",
          value: "Kling 3.0 requires a start_frame when end_frame is provided".to_string(),
        }));
      }
      FalKling3p0Mode::TextToVideo
    }
    Some(image_url) => FalKling3p0Mode::ImageToVideo {
      image_url,
      end_image_url: optional_url(request.end_frame)?,
    },
  };

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(Kling3p0Common {
    prompt: request.prompt.unwrap_or("").to_string(),
    negative_prompt: request.negative_prompt.map(|s| s.to_string()),
    mode,
    aspect_ratio,
    duration,
    generate_audio: request.generate_audio,
  })
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalKling3p0AspectRatio>, ArtcraftRouterError> {
  use FalKling3p0AspectRatio as Ar;
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
) -> Result<Option<FalKling3p0Duration>, ArtcraftRouterError> {
  const MIN: u16 = 3;
  const MAX: u16 = 15;
  match duration_seconds {
    None => Ok(None),
    Some(d) if (MIN..=MAX).contains(&d) => Ok(Some(FalKling3p0Duration(d as u8))),
    Some(d) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(Some(FalKling3p0Duration(d.clamp(MIN, MAX) as u8))),
    },
  }
}

impl PlanFalKling3p0Pro {
  /// Default duration is 5s when None per Fal client.
  pub fn duration_seconds_for_cost(&self) -> u64 {
    self.duration.map(|d| d.0 as u64).unwrap_or(5)
  }

  /// Default `generate_audio` is true per Fal client.
  pub fn generate_audio_for_cost(&self) -> bool {
    self.generate_audio.unwrap_or(true)
  }
}
