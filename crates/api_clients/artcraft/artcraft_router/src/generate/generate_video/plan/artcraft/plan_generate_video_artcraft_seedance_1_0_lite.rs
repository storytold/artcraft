use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::{
  GenerateSeedance10LiteAspectRatio, GenerateSeedance10LiteDuration,
  GenerateSeedance10LiteResolution,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftSeedance10Lite<'a> {
  pub prompt: Option<&'a str>,
  pub start_frame: &'a MediaFileToken,
  pub end_frame: Option<&'a MediaFileToken>,
  pub aspect_ratio: Option<GenerateSeedance10LiteAspectRatio>,
  pub resolution: Option<GenerateSeedance10LiteResolution>,
  pub duration: Option<GenerateSeedance10LiteDuration>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_seedance_1_0_lite<'a>(
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
        value: "Seedance 1.0 Lite requires a starting frame".to_string(),
      }))
    }
  };
  let end_frame = resolve_end_frame(request.end_frame)?;

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftSeedance10Lite(PlanArtcraftSeedance10Lite {
    prompt: request.prompt,
    start_frame,
    end_frame,
    aspect_ratio,
    resolution,
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
) -> Result<Option<GenerateSeedance10LiteAspectRatio>, ArtcraftRouterError> {
  use GenerateSeedance10LiteAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(Ar::Auto)),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(Ar::Square)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(Ar::FourByThree)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(Ar::TwentyOneByNine)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(Ar::ThreeByFour)),
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
) -> Result<Option<GenerateSeedance10LiteResolution>, ArtcraftRouterError> {
  use GenerateSeedance10LiteResolution as R;
  // Legacy endpoint exposes only 480p and 720p.
  match resolution {
    None => Ok(None),
    Some(CommonResolution::FourEightyP) => Ok(Some(R::FourEightyP)),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(R::SevenTwentyP)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(R::SevenTwentyP)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(R::FourEightyP)),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GenerateSeedance10LiteDuration>, ArtcraftRouterError> {
  use GenerateSeedance10LiteDuration as D;
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

impl PlanArtcraftSeedance10Lite<'_> {
  /// Legacy handler default: 5 seconds.
  pub fn duration_seconds_for_cost(&self) -> u64 {
    match self.duration {
      None | Some(GenerateSeedance10LiteDuration::FiveSeconds) => 5,
      Some(GenerateSeedance10LiteDuration::TenSeconds) => 10,
    }
  }

  /// Legacy handler default: 720p.
  pub fn resolution_for_cost(&self) -> GenerateSeedance10LiteResolution {
    self.resolution.unwrap_or(GenerateSeedance10LiteResolution::SevenTwentyP)
  }
}
