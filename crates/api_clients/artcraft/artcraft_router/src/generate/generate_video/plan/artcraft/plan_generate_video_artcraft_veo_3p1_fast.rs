use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::multi_function::veo_3p1_fast_multi_function_video_gen::{
  Veo3p1FastMultiFunctionVideoGenAspectRatio, Veo3p1FastMultiFunctionVideoGenDuration,
  Veo3p1FastMultiFunctionVideoGenResolution,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftVeo3p1Fast {
  pub prompt: Option<String>,
  pub negative_prompt: Option<String>,
  pub start_frame: Option<MediaFileToken>,
  pub end_frame: Option<MediaFileToken>,
  pub aspect_ratio: Option<Veo3p1FastMultiFunctionVideoGenAspectRatio>,
  pub resolution: Option<Veo3p1FastMultiFunctionVideoGenResolution>,
  pub duration: Option<Veo3p1FastMultiFunctionVideoGenDuration>,
  pub generate_audio: Option<bool>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_veo_3p1_fast(
  request: &GenerateVideoRequestBuilder,
) -> Result<VideoGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = resolve_image_ref(request.start_frame.clone())?;
  let end_frame = resolve_image_ref(request.end_frame.clone())?;

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftVeo3p1Fast(PlanArtcraftVeo3p1Fast {
    prompt: request.prompt.clone(),
    negative_prompt: request.negative_prompt.clone(),
    start_frame,
    end_frame,
    aspect_ratio,
    resolution,
    duration,
    generate_audio: request.generate_audio,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn resolve_image_ref(
  image_ref: Option<ImageRef>,
) -> Result<Option<MediaFileToken>, ArtcraftRouterError> {
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
) -> Result<Option<Veo3p1FastMultiFunctionVideoGenAspectRatio>, ArtcraftRouterError> {
  use Veo3p1FastMultiFunctionVideoGenAspectRatio as Ar;
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
) -> Result<Option<Veo3p1FastMultiFunctionVideoGenResolution>, ArtcraftRouterError> {
  use Veo3p1FastMultiFunctionVideoGenResolution as R;
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
) -> Result<Option<Veo3p1FastMultiFunctionVideoGenDuration>, ArtcraftRouterError> {
  use Veo3p1FastMultiFunctionVideoGenDuration as D;
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

impl PlanArtcraftVeo3p1Fast {
  /// Legacy Veo 3.1 Fast multi-function handler defaults `None` to SixSeconds.
  pub fn duration_seconds_for_cost(&self) -> u64 {
    use Veo3p1FastMultiFunctionVideoGenDuration as D;
    match self.duration {
      None | Some(D::SixSeconds) => 6,
      Some(D::FourSeconds) => 4,
      Some(D::EightSeconds) => 8,
    }
  }

  /// Legacy Veo 3.1 Fast multi-function handler defaults `generate_audio` to true.
  pub fn generate_audio_for_cost(&self) -> bool {
    self.generate_audio.unwrap_or(true)
  }
}
