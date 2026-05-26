use fal_client::requests::webhook::video::image::enqueue_seedance_1_lite_image_to_video_webhook::{
  Seedance1LiteAspectRatio, Seedance1LiteDuration, Seedance1LiteRequest, Seedance1LiteResolution,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::fal::seedance_1p0_lite::request::FalSeedance10LiteRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_fal_seedance_1p0_lite(
  mut builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let image_url = require_url(
    builder.start_frame.take(),
    "start_frame",
    "Seedance 1.0 Lite requires a starting frame",
  )?;
  let end_frame_image_url = optional_url(builder.end_frame.take())?;
  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_resolution(builder.resolution.take(), strategy)?;
  let duration = plan_duration(builder.duration_seconds.take(), strategy)?;
  let prompt = builder.prompt.take().unwrap_or_default();

  let request = Seedance1LiteRequest {
    image_url,
    end_frame_image_url,
    prompt,
    duration,
    resolution,
    aspect_ratio,
    camera_fixed: false,
    seed: None,
  };

  let state = FalSeedance10LiteRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalSeedance10Lite(state)))
}

// ── Plan helpers (copies of v1 logic; kept in sync intentionally) ──

fn require_url(
  start_frame: Option<ImageRef>,
  field: &'static str,
  msg: &'static str,
) -> Result<String, ArtcraftRouterError> {
  match start_frame {
    Some(ImageRef::Url(url)) => Ok(url),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field,
        value: "Fal only supports image URLs, not media file tokens".to_string(),
      }))
    }
    None => Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field,
      value: msg.to_string(),
    })),
  }
}

fn optional_url(image_ref: Option<ImageRef>) -> Result<Option<String>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::Url(url)) => Ok(Some(url)),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "end_frame",
        value: "Fal only supports image URLs, not media file tokens".to_string(),
      }))
    }
  }
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance1LiteAspectRatio>, ArtcraftRouterError> {
  use Seedance1LiteAspectRatio as Ar;
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
) -> Result<Seedance1LiteResolution, ArtcraftRouterError> {
  use Seedance1LiteResolution as R;
  match resolution {
    None => Ok(R::SevenTwentyP),
    Some(CommonResolution::FourEightyP) => Ok(R::FourEightyP),
    Some(CommonResolution::SevenTwentyP) => Ok(R::SevenTwentyP),
    Some(CommonResolution::TenEightyP) => Ok(R::TenEightyP),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(R::TenEightyP),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(R::FourEightyP),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Seedance1LiteDuration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Seedance1LiteDuration::FiveSeconds),
    Some(5) => Ok(Seedance1LiteDuration::FiveSeconds),
    Some(10) => Ok(Seedance1LiteDuration::TenSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Seedance1LiteDuration::TenSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Seedance1LiteDuration::FiveSeconds),
    },
  }
}
