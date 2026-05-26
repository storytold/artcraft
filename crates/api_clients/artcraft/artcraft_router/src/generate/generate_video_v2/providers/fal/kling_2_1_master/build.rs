use fal_client::requests::webhook::video::image::enqueue_kling_v2p1_master_image_to_video_webhook::{
  Kling2p1MasterAspectRatio, Kling2p1MasterDuration, Kling2p1MasterRequest,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::fal::kling_1_6_pro::build::require_url;
use crate::generate::generate_video_v2::providers::fal::kling_2_1_master::request::FalKling21MasterRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_fal_kling_2_1_master(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let image_url = require_url(builder.start_frame.clone(), "start_frame", "Kling 2.1 Master requires a starting frame")?;
  if builder.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Kling 2.1 Master does not support an ending frame".to_string(),
    }));
  }

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;

  let request = Kling2p1MasterRequest {
    image_url,
    prompt: builder.prompt.clone().unwrap_or_default(),
    duration,
    aspect_ratio,
  };

  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling21Master(
    FalKling21MasterRequestState { request },
  )))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Kling2p1MasterAspectRatio, ArtcraftRouterError> {
  use Kling2p1MasterAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(Ar::WideSixteenNine),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Ar::Square),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Ar::WideSixteenNine),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Ar::TallNineSixteen),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Ar::WideSixteenNine),

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
) -> Result<Kling2p1MasterDuration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Kling2p1MasterDuration::Default),
    Some(5) => Ok(Kling2p1MasterDuration::FiveSeconds),
    Some(10) => Ok(Kling2p1MasterDuration::TenSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Kling2p1MasterDuration::TenSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Kling2p1MasterDuration::FiveSeconds),
    },
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;

  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling21Master,
      provider: Provider::Fal,
      prompt: Some("test".to_string()),
      start_frame: Some(ImageRef::Url("https://example.com/a.png".to_string())),
      ..Default::default()
    }
  }

  #[test]
  fn missing_start_frame_errors() {
    let mut b = base_builder();
    b.start_frame = None;
    assert!(build_fal_kling_2_1_master(b).is_err());
  }

  #[test]
  fn end_frame_errors() {
    let mut b = base_builder();
    b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
    assert!(build_fal_kling_2_1_master(b).is_err());
  }
}
