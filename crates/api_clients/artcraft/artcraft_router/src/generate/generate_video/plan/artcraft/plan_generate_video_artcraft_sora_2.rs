use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::multi_function::sora_2_multi_function_video_gen::{
  Sora2MultiFunctionVideoGenAspectRatio, Sora2MultiFunctionVideoGenDuration,
  Sora2MultiFunctionVideoGenResolution,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftSora2 {
  pub prompt: Option<String>,
  pub start_frame: Option<MediaFileToken>,
  pub aspect_ratio: Option<Sora2MultiFunctionVideoGenAspectRatio>,
  pub resolution: Option<Sora2MultiFunctionVideoGenResolution>,
  pub duration: Option<Sora2MultiFunctionVideoGenDuration>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_sora_2(
  request: &GenerateVideoRequestBuilder,
) -> Result<VideoGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = match request.start_frame.clone() {
    None => None,
    Some(ImageRef::MediaFileToken(t)) => Some(t),
    Some(ImageRef::Url(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  };

  if request.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Sora 2 does not support an ending frame".to_string(),
    }));
  }

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftSora2(PlanArtcraftSora2 {
    prompt: request.prompt.clone(),
    start_frame,
    aspect_ratio,
    resolution,
    duration,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Sora2MultiFunctionVideoGenAspectRatio>, ArtcraftRouterError> {
  use Sora2MultiFunctionVideoGenAspectRatio as Ar;
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
) -> Result<Option<Sora2MultiFunctionVideoGenResolution>, ArtcraftRouterError> {
  use Sora2MultiFunctionVideoGenResolution as R;
  match resolution {
    None => Ok(None),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(R::SevenTwentyP)),
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
) -> Result<Option<Sora2MultiFunctionVideoGenDuration>, ArtcraftRouterError> {
  use Sora2MultiFunctionVideoGenDuration as D;
  match duration_seconds {
    None => Ok(None),
    Some(4) => Ok(Some(D::FourSeconds)),
    Some(8) => Ok(Some(D::EightSeconds)),
    Some(12) => Ok(Some(D::TwelveSeconds)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(D::TwelveSeconds)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(D::FourSeconds)),
    },
  }
}

impl PlanArtcraftSora2 {
  /// Fal client default: 4 seconds when None.
  pub fn duration_seconds_for_cost(&self) -> u64 {
    use Sora2MultiFunctionVideoGenDuration as D;
    match self.duration {
      None | Some(D::FourSeconds) => 4,
      Some(D::EightSeconds) => 8,
      Some(D::TwelveSeconds) => 12,
    }
  }
}
