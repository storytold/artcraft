use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::generate_kling_2_1_master_image_to_video::{
  GenerateKling21MasterAspectRatio, GenerateKling21MasterDuration,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftKling21Master {
  pub prompt: Option<String>,
  pub start_frame: MediaFileToken,
  pub aspect_ratio: Option<GenerateKling21MasterAspectRatio>,
  pub duration: Option<GenerateKling21MasterDuration>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_kling_2_1_master(
  request: &GenerateVideoRequestBuilder,
) -> Result<VideoGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = match request.start_frame.clone() {
    Some(ImageRef::MediaFileToken(t)) => t,
    Some(ImageRef::Url(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
    None => {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "start_frame",
        value: "Kling 2.1 Master requires a starting frame".to_string(),
      }))
    }
  };

  if request.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Kling 2.1 Master does not support an ending frame".to_string(),
    }));
  }

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftKling21Master(PlanArtcraftKling21Master {
    prompt: request.prompt.clone(),
    start_frame,
    aspect_ratio,
    duration,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GenerateKling21MasterAspectRatio>, ArtcraftRouterError> {
  use GenerateKling21MasterAspectRatio as Ar;
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

fn nearest_aspect_ratio(ar: CommonAspectRatio) -> GenerateKling21MasterAspectRatio {
  use GenerateKling21MasterAspectRatio as Ar;
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
) -> Result<Option<GenerateKling21MasterDuration>, ArtcraftRouterError> {
  use GenerateKling21MasterDuration as D;
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

impl PlanArtcraftKling21Master {
  pub fn is_ten_seconds(&self) -> bool {
    matches!(self.duration, Some(GenerateKling21MasterDuration::TenSeconds))
  }
}
