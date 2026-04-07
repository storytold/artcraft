use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::generate_veo_2_image_to_video::{
  GenerateVeo2AspectRatio, GenerateVeo2Duration,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftVeo2<'a> {
  pub prompt: Option<&'a str>,
  pub start_frame: &'a MediaFileToken,
  pub aspect_ratio: Option<GenerateVeo2AspectRatio>,
  pub duration: Option<GenerateVeo2Duration>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_veo_2<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = match request.start_frame {
    Some(ImageRef::MediaFileToken(t)) => t,
    Some(ImageRef::Url(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
    None => {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "start_frame",
        value: "Veo 2 requires a starting frame".to_string(),
      }))
    }
  };

  if request.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Veo 2 does not support an ending frame".to_string(),
    }));
  }

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftVeo2(PlanArtcraftVeo2 {
    prompt: request.prompt,
    start_frame,
    aspect_ratio,
    duration,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GenerateVeo2AspectRatio>, ArtcraftRouterError> {
  use GenerateVeo2AspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(Ar::Auto)),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Ar::WideSixteenNine)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(Ar::TallNineSixteen)),

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

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GenerateVeo2Duration>, ArtcraftRouterError> {
  use GenerateVeo2Duration as D;
  match duration_seconds {
    None => Ok(None),
    Some(5) => Ok(Some(D::FiveSeconds)),
    Some(6) => Ok(Some(D::SixSeconds)),
    Some(7) => Ok(Some(D::SevenSeconds)),
    Some(8) => Ok(Some(D::EightSeconds)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(D::EightSeconds)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(D::FiveSeconds)),
    },
  }
}

impl PlanArtcraftVeo2<'_> {
  /// Mirrors the Fal client's default-resolved duration used for billing.
  pub fn duration_seconds_for_cost(&self) -> u64 {
    match self.duration {
      // Legacy generate handler defaults `None` to FiveSeconds.
      None | Some(GenerateVeo2Duration::FiveSeconds) => 5,
      Some(GenerateVeo2Duration::SixSeconds) => 6,
      Some(GenerateVeo2Duration::SevenSeconds) => 7,
      Some(GenerateVeo2Duration::EightSeconds) => 8,
    }
  }
}
