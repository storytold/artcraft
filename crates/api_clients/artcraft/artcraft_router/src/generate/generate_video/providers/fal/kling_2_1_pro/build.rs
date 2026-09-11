use fal_client::requests_old::webhook::video::image::enqueue_kling_v2p1_pro_image_to_video_webhook::{
  Kling2p1ProAspectRatio, Kling2p1ProDuration, Kling2p1ProRequest,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::kling_1_6_pro::build::{optional_url, require_url};
use crate::generate::generate_video::providers::fal::kling_2_1_pro::request::FalKling21ProRequestState;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_fal_kling_2_1_pro(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let image_url = require_url(builder.start_frame.clone(), "start_frame", "Kling 2.1 Pro requires a starting frame")?;
  let end_frame_image_url = optional_url(builder.end_frame.clone())?;
  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;

  let request = Kling2p1ProRequest {
    image_url,
    end_frame_image_url,
    prompt: builder.prompt.clone().unwrap_or_default(),
    duration,
    aspect_ratio,
  };

  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling21Pro(
    FalKling21ProRequestState { request },
  )))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Kling2p1ProAspectRatio, ArtcraftRouterError> {
  use Kling2p1ProAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(Ar::WideSixteenNine),

    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => Ok(Ar::Square),
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Ar::WideSixteenNine),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Ar::TallNineSixteen),

    Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto4k) => Ok(Ar::WideSixteenNine),

    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", other),
        }))
      }
      _ => Ok(Ar::WideSixteenNine),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Kling2p1ProDuration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Kling2p1ProDuration::Default),
    Some(5) => Ok(Kling2p1ProDuration::FiveSeconds),
    Some(10) => Ok(Kling2p1ProDuration::TenSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Kling2p1ProDuration::TenSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Kling2p1ProDuration::FiveSeconds),
    },
  }
}
