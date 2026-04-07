use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::multi_function::kling_2_6_multi_function_video_gen::{
  Kling2p6ProMultiFunctionVideoGenAspectRatio, Kling2p6ProMultiFunctionVideoGenDuration,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftKling2p6Pro<'a> {
  pub prompt: Option<&'a str>,
  pub negative_prompt: Option<&'a str>,
  pub start_frame: Option<&'a MediaFileToken>,
  pub aspect_ratio: Option<Kling2p6ProMultiFunctionVideoGenAspectRatio>,
  pub duration: Option<Kling2p6ProMultiFunctionVideoGenDuration>,
  pub generate_audio: Option<bool>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_kling_2_6_pro<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = match request.start_frame {
    None => None,
    Some(ImageRef::MediaFileToken(t)) => Some(t),
    Some(ImageRef::Url(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  };

  if request.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Kling 2.6 Pro does not support an ending frame".to_string(),
    }));
  }

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftKling2p6Pro(PlanArtcraftKling2p6Pro {
    prompt: request.prompt,
    negative_prompt: request.negative_prompt,
    start_frame,
    aspect_ratio,
    duration,
    generate_audio: request.generate_audio,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Kling2p6ProMultiFunctionVideoGenAspectRatio>, ArtcraftRouterError> {
  use Kling2p6ProMultiFunctionVideoGenAspectRatio as Ar;
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

fn nearest_aspect_ratio(ar: CommonAspectRatio) -> Kling2p6ProMultiFunctionVideoGenAspectRatio {
  use Kling2p6ProMultiFunctionVideoGenAspectRatio as Ar;
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
) -> Result<Option<Kling2p6ProMultiFunctionVideoGenDuration>, ArtcraftRouterError> {
  use Kling2p6ProMultiFunctionVideoGenDuration as D;
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

impl PlanArtcraftKling2p6Pro<'_> {
  pub fn is_ten_seconds(&self) -> bool {
    matches!(self.duration, Some(Kling2p6ProMultiFunctionVideoGenDuration::TenSeconds))
  }

  /// Legacy Kling 2.6 Pro generate handler forwards `request.generate_audio` as-is
  /// to the Fal client, which defaults to `true`.
  pub fn generate_audio_for_cost(&self) -> bool {
    self.generate_audio.unwrap_or(true)
  }
}
