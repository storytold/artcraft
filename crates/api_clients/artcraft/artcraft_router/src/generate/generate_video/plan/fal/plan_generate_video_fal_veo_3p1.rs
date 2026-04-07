use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

/// Three-way internal selection of which Fal Veo 3.1 endpoint to call.
/// Veo 3.1 / 3.1 Fast each expose distinct (but parallel) types per endpoint —
/// we resolve those at execute time.
#[derive(Debug, Clone)]
pub enum FalVeo3p1Mode {
  TextToVideo,
  ImageToVideo { start_frame_url: String },
  FirstLastFrame { first_frame_url: String, last_frame_url: String },
}

#[derive(Debug, Clone, Copy)]
pub enum FalVeo3p1AspectRatio {
  Auto,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Debug, Clone, Copy)]
pub enum FalVeo3p1Resolution {
  SevenTwentyP,
  TenEightyP,
}

#[derive(Debug, Clone, Copy)]
pub enum FalVeo3p1Duration {
  Four,
  Six,
  Eight,
}

#[derive(Debug, Clone)]
pub struct PlanFalVeo3p1 {
  pub prompt: String,
  pub negative_prompt: Option<String>,
  pub mode: FalVeo3p1Mode,
  pub aspect_ratio: Option<FalVeo3p1AspectRatio>,
  pub resolution: Option<FalVeo3p1Resolution>,
  pub duration: Option<FalVeo3p1Duration>,
  pub generate_audio: Option<bool>,
}

pub fn plan_generate_video_fal_veo_3p1<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let plan = build_plan_fal_veo_3p1(request, "Veo 3.1")?;
  Ok(VideoGenerationPlan::FalVeo3p1(plan))
}

pub(crate) fn build_plan_fal_veo_3p1<'a>(
  request: &'a GenerateVideoRequest<'a>,
  model_label: &'static str,
) -> Result<PlanFalVeo3p1, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let mode = resolve_mode(request.start_frame, request.end_frame, model_label)?;
  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(PlanFalVeo3p1 {
    prompt: request.prompt.unwrap_or("").to_string(),
    negative_prompt: request.negative_prompt.map(|s| s.to_string()),
    mode,
    aspect_ratio,
    resolution,
    duration,
    generate_audio: request.generate_audio,
  })
}

fn resolve_mode(
  start_frame: Option<ImageRef<'_>>,
  end_frame: Option<ImageRef<'_>>,
  model_label: &'static str,
) -> Result<FalVeo3p1Mode, ArtcraftRouterError> {
  let start = resolve_optional_image_url(start_frame)?;
  let end = resolve_optional_image_url(end_frame)?;
  match (start, end) {
    (None, None) => Ok(FalVeo3p1Mode::TextToVideo),
    (Some(s), None) => Ok(FalVeo3p1Mode::ImageToVideo { start_frame_url: s }),
    (Some(s), Some(e)) => Ok(FalVeo3p1Mode::FirstLastFrame {
      first_frame_url: s,
      last_frame_url: e,
    }),
    (None, Some(_)) => Err(unsupported(
      "end_frame",
      &format!("{} requires a start_frame when end_frame is provided", model_label),
    )),
  }
}

fn resolve_optional_image_url(
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
) -> Result<Option<FalVeo3p1AspectRatio>, ArtcraftRouterError> {
  use FalVeo3p1AspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(Ar::Auto)),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", other)))
      }
      _ => Ok(Some(Ar::Auto)),
    },
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalVeo3p1Resolution>, ArtcraftRouterError> {
  use FalVeo3p1Resolution as R;
  match resolution {
    None => Ok(None),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(R::SevenTwentyP)),
    Some(CommonResolution::TenEightyP) => Ok(Some(R::TenEightyP)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("resolution", &format!("{:?}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(R::TenEightyP)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(R::SevenTwentyP)),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalVeo3p1Duration>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(4) => Ok(Some(FalVeo3p1Duration::Four)),
    Some(6) => Ok(Some(FalVeo3p1Duration::Six)),
    Some(8) => Ok(Some(FalVeo3p1Duration::Eight)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("duration_seconds", &format!("{}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(FalVeo3p1Duration::Eight)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(FalVeo3p1Duration::Four)),
    },
  }
}

fn unsupported(field: &'static str, value: &str) -> ArtcraftRouterError {
  ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
    field,
    value: value.to_string(),
  })
}

impl PlanFalVeo3p1 {
  pub fn duration_seconds_for_cost(&self) -> u64 {
    match self.duration {
      Some(FalVeo3p1Duration::Four) => 4,
      Some(FalVeo3p1Duration::Six) => 6,
      Some(FalVeo3p1Duration::Eight) | None => 8,
    }
  }

  pub fn generate_audio_for_cost(&self) -> bool {
    self.generate_audio.unwrap_or(true)
  }
}
