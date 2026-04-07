use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::multi_function::veo_3p1_multi_function_video_gen::{
  Veo3p1MultiFunctionVideoGenAspectRatio, Veo3p1MultiFunctionVideoGenDuration,
  Veo3p1MultiFunctionVideoGenResolution,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftVeo3p1<'a> {
  pub prompt: Option<&'a str>,
  pub negative_prompt: Option<&'a str>,
  pub start_frame: Option<&'a MediaFileToken>,
  pub end_frame: Option<&'a MediaFileToken>,
  pub aspect_ratio: Option<Veo3p1MultiFunctionVideoGenAspectRatio>,
  pub resolution: Option<Veo3p1MultiFunctionVideoGenResolution>,
  pub duration: Option<Veo3p1MultiFunctionVideoGenDuration>,
  pub generate_audio: Option<bool>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_veo_3p1<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let plan = build_plan_artcraft_veo_3p1(request)?;
  Ok(VideoGenerationPlan::ArtcraftVeo3p1(plan))
}

pub(crate) fn build_plan_artcraft_veo_3p1<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<PlanArtcraftVeo3p1<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = resolve_image_ref(request.start_frame)?;
  let end_frame = resolve_image_ref(request.end_frame)?;

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(PlanArtcraftVeo3p1 {
    prompt: request.prompt,
    negative_prompt: request.negative_prompt,
    start_frame,
    end_frame,
    aspect_ratio,
    resolution,
    duration,
    generate_audio: request.generate_audio,
    idempotency_token: request.get_or_generate_idempotency_token(),
  })
}

fn resolve_image_ref<'a>(
  image_ref: Option<ImageRef<'a>>,
) -> Result<Option<&'a MediaFileToken>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::MediaFileToken(t)) => Ok(Some(t)),
    Some(ImageRef::Url(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Veo3p1MultiFunctionVideoGenAspectRatio>, ArtcraftRouterError> {
  use Veo3p1MultiFunctionVideoGenAspectRatio as Ar;
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
      _ => Ok(Some(Ar::Auto)),
    },
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Veo3p1MultiFunctionVideoGenResolution>, ArtcraftRouterError> {
  use Veo3p1MultiFunctionVideoGenResolution as R;
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
) -> Result<Option<Veo3p1MultiFunctionVideoGenDuration>, ArtcraftRouterError> {
  use Veo3p1MultiFunctionVideoGenDuration as D;
  match duration_seconds {
    None => Ok(None),
    Some(4) => Ok(Some(D::FourSeconds)),
    Some(6) => Ok(Some(D::SixSeconds)),
    Some(8) => Ok(Some(D::EightSeconds)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(D::EightSeconds)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(D::FourSeconds)),
    },
  }
}

impl PlanArtcraftVeo3p1<'_> {
  /// Legacy Veo 3.1 multi-function handler defaults `None` to SixSeconds.
  pub fn duration_seconds_for_cost(&self) -> u64 {
    use Veo3p1MultiFunctionVideoGenDuration as D;
    match self.duration {
      None | Some(D::SixSeconds) => 6,
      Some(D::FourSeconds) => 4,
      Some(D::EightSeconds) => 8,
    }
  }

  /// Legacy Veo 3.1 multi-function handler defaults `generate_audio` to true.
  pub fn generate_audio_for_cost(&self) -> bool {
    self.generate_audio.unwrap_or(true)
  }
}
