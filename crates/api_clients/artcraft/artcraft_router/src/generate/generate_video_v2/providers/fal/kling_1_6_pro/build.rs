use fal_client::requests::webhook::video::image::enqueue_kling_v1p6_pro_image_to_video_webhook::{
  Kling1p6ProAspectRatio, Kling1p6ProDuration, Kling1p6ProRequest,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::fal::kling_1_6_pro::request::FalKling16ProRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_fal_kling_1_6_pro(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let image_url = require_url(builder.start_frame.clone(), "start_frame", "Kling 1.6 Pro requires a starting frame")?;
  let end_frame_image_url = optional_url(builder.end_frame.clone())?;
  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;

  let request = Kling1p6ProRequest {
    image_url,
    end_frame_image_url,
    prompt: builder.prompt.clone().unwrap_or_default(),
    duration,
    aspect_ratio,
  };

  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling16Pro(
    FalKling16ProRequestState { request },
  )))
}

pub(crate) fn require_url(
  image_ref: Option<ImageRef>,
  field: &'static str,
  reason: &str,
) -> Result<String, ArtcraftRouterError> {
  match image_ref {
    Some(ImageRef::Url(url)) => Ok(url),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
    None => Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field,
      value: reason.to_string(),
    })),
  }
}

pub(crate) fn optional_url(image_ref: Option<ImageRef>) -> Result<Option<String>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::Url(url)) => Ok(Some(url)),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Kling1p6ProAspectRatio, ArtcraftRouterError> {
  use Kling1p6ProAspectRatio as Ar;
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
) -> Result<Kling1p6ProDuration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Kling1p6ProDuration::Default),
    Some(5) => Ok(Kling1p6ProDuration::FiveSeconds),
    Some(10) => Ok(Kling1p6ProDuration::TenSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Kling1p6ProDuration::TenSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Kling1p6ProDuration::FiveSeconds),
    },
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;

  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling16Pro,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      start_frame: Some(ImageRef::Url("https://example.com/a.png".to_string())),
      ..Default::default()
    }
  }

  #[test]
  fn missing_start_frame_errors() {
    let mut b = base_builder();
    b.start_frame = None;
    assert!(build_fal_kling_1_6_pro(b).is_err());
  }

  #[test]
  fn end_frame_is_optional() {
    let mut b = base_builder();
    b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
    assert!(build_fal_kling_1_6_pro(b).is_ok());
  }

  #[test]
  fn full_combinatorial_pass() {
    let aspect_ratios = [None, Some(RouterAspectRatio::Square), Some(RouterAspectRatio::WideSixteenByNine), Some(RouterAspectRatio::TallNineBySixteen), Some(RouterAspectRatio::Auto)];
    let durations = [None, Some(5u16), Some(10)];
    let mut combos = 0;
    for &aspect_ratio in &aspect_ratios {
      for &duration in &durations {
        for include_end in [false, true] {
          let mut b = base_builder();
          b.aspect_ratio = aspect_ratio;
          b.duration_seconds = duration;
          if include_end {
            b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
          }
          assert!(build_fal_kling_1_6_pro(b).is_ok());
          combos += 1;
        }
      }
    }
    assert_eq!(combos, 5 * 3 * 2);
  }
}
