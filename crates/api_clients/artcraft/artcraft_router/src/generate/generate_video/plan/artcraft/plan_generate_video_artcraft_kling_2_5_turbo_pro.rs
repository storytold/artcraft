use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::multi_function::kling_2_5_turbo_multi_function_video_gen::{
  Kling2p5TurboProMultiFunctionVideoGenAspectRatio, Kling2p5TurboProMultiFunctionVideoGenDuration,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftKling2p5TurboPro<'a> {
  pub prompt: Option<&'a str>,
  pub negative_prompt: Option<&'a str>,
  pub start_frame: Option<&'a MediaFileToken>,
  pub end_frame: Option<&'a MediaFileToken>,
  pub aspect_ratio: Option<Kling2p5TurboProMultiFunctionVideoGenAspectRatio>,
  pub duration: Option<Kling2p5TurboProMultiFunctionVideoGenDuration>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_kling_2_5_turbo_pro<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = resolve_image_ref(request.start_frame)?;
  let end_frame = resolve_image_ref(request.end_frame)?;

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftKling2p5TurboPro(PlanArtcraftKling2p5TurboPro {
    prompt: request.prompt,
    negative_prompt: request.negative_prompt,
    start_frame,
    end_frame,
    aspect_ratio,
    duration,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
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
) -> Result<Option<Kling2p5TurboProMultiFunctionVideoGenAspectRatio>, ArtcraftRouterError> {
  use Kling2p5TurboProMultiFunctionVideoGenAspectRatio as Ar;
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
      _ => Ok(Some(nearest_aspect_ratio(unsupported))),
    },
  }
}

fn nearest_aspect_ratio(ar: CommonAspectRatio) -> Kling2p5TurboProMultiFunctionVideoGenAspectRatio {
  use Kling2p5TurboProMultiFunctionVideoGenAspectRatio as Ar;
  match ar {
    CommonAspectRatio::WideFourByThree
    | CommonAspectRatio::WideFiveByFour
    | CommonAspectRatio::WideThreeByTwo
    | CommonAspectRatio::WideTwentyOneByNine => Ar::SixteenByNine,
    CommonAspectRatio::TallThreeByFour
    | CommonAspectRatio::TallFourByFive
    | CommonAspectRatio::TallTwoByThree
    | CommonAspectRatio::TallNineByTwentyOne => Ar::NineBySixteen,
    _ => Ar::Square,
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Kling2p5TurboProMultiFunctionVideoGenDuration>, ArtcraftRouterError> {
  use Kling2p5TurboProMultiFunctionVideoGenDuration as D;
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

impl PlanArtcraftKling2p5TurboPro<'_> {
  pub fn is_ten_seconds(&self) -> bool {
    matches!(self.duration, Some(Kling2p5TurboProMultiFunctionVideoGenDuration::TenSeconds))
  }
}
