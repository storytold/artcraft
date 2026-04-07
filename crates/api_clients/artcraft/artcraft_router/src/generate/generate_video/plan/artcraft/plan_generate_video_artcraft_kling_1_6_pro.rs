use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::{
  GenerateKling16ProAspectRatio, GenerateKling16ProDuration,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftKling16Pro<'a> {
  pub prompt: Option<&'a str>,
  pub start_frame: &'a MediaFileToken,
  pub end_frame: Option<&'a MediaFileToken>,
  pub aspect_ratio: Option<GenerateKling16ProAspectRatio>,
  pub duration: Option<GenerateKling16ProDuration>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_kling_1_6_pro<'a>(
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
        value: "Kling 1.6 Pro requires a starting frame".to_string(),
      }))
    }
  };
  let end_frame = resolve_end_frame(request.end_frame)?;

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftKling16Pro(PlanArtcraftKling16Pro {
    prompt: request.prompt,
    start_frame,
    end_frame,
    aspect_ratio,
    duration,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn resolve_end_frame<'a>(
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
) -> Result<Option<GenerateKling16ProAspectRatio>, ArtcraftRouterError> {
  use GenerateKling16ProAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(Ar::Square)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Ar::WideSixteenNine)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(Ar::TallNineSixteen)),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(Ar::WideSixteenNine)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(nearest_aspect_ratio(unsupported))),
    },
  }
}

fn nearest_aspect_ratio(ar: CommonAspectRatio) -> GenerateKling16ProAspectRatio {
  use GenerateKling16ProAspectRatio as Ar;
  match ar {
    CommonAspectRatio::WideFourByThree
    | CommonAspectRatio::WideFiveByFour
    | CommonAspectRatio::WideThreeByTwo
    | CommonAspectRatio::WideTwentyOneByNine => Ar::WideSixteenNine,
    CommonAspectRatio::TallThreeByFour
    | CommonAspectRatio::TallFourByFive
    | CommonAspectRatio::TallTwoByThree
    | CommonAspectRatio::TallNineByTwentyOne => Ar::TallNineSixteen,
    _ => Ar::Square,
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GenerateKling16ProDuration>, ArtcraftRouterError> {
  use GenerateKling16ProDuration as D;
  match duration_seconds {
    None => Ok(None),
    Some(5) => Ok(Some(D::FiveSeconds)),
    Some(10) => Ok(Some(D::TenSeconds)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(D::TenSeconds)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(D::FiveSeconds)),
    },
  }
}

impl PlanArtcraftKling16Pro<'_> {
  pub fn is_ten_seconds(&self) -> bool {
    matches!(self.duration, Some(GenerateKling16ProDuration::TenSeconds))
  }
}
