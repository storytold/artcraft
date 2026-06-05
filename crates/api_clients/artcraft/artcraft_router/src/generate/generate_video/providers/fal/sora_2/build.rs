use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::kling_1_6_pro::build::optional_url;
use crate::generate::generate_video::providers::fal::sora_2::request::{
  FalSora2AspectRatio, FalSora2Duration, FalSora2Mode, FalSora2RequestState, FalSora2Resolution,
};
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_fal_sora_2(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  if builder.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Sora 2 does not support an ending frame".to_string(),
    }));
  }

  let mode = match optional_url(builder.start_frame.clone())? {
    None => FalSora2Mode::TextToVideo,
    Some(image_url) => FalSora2Mode::ImageToVideo { image_url },
  };

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let resolution = plan_resolution(builder.resolution, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;

  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalSora2(
    FalSora2RequestState {
      prompt: builder.prompt.clone().unwrap_or_default(),
      mode,
      aspect_ratio,
      resolution,
      duration,
    },
  )))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSora2AspectRatio>, ArtcraftRouterError> {
  use FalSora2AspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto4k) => Ok(Some(Ar::Auto)),

    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(Ar::SixteenByNine)),
    },
  }
}

fn plan_resolution(
  resolution: Option<RouterResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSora2Resolution>, ArtcraftRouterError> {
  use FalSora2Resolution as R;
  match resolution {
    None => Ok(None),
    Some(RouterResolution::SevenTwentyP) => Ok(Some(R::SevenTwentyP)),
    // Only 720p is supported; everything else falls back or errors.
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", other),
        }))
      }
      _ => Ok(Some(R::SevenTwentyP)),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSora2Duration>, ArtcraftRouterError> {
  use FalSora2Duration as D;
  match duration_seconds {
    None => Ok(None),
    Some(4) => Ok(Some(D::Four)),
    Some(8) => Ok(Some(D::Eight)),
    Some(12) => Ok(Some(D::Twelve)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(D::Twelve)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(D::Four)),
    },
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;

  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Sora2,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  #[test]
  fn no_start_frame_picks_t2v() {
    let r = build_fal_sora_2(base_builder()).expect("build");
    if let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalSora2(s)) = r {
      assert!(matches!(s.mode, FalSora2Mode::TextToVideo));
    } else { panic!("expected FalSora2"); }
  }

  #[test]
  fn start_frame_picks_i2v() {
    let mut b = base_builder();
    b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    let r = build_fal_sora_2(b).expect("build");
    if let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalSora2(s)) = r {
      assert!(matches!(s.mode, FalSora2Mode::ImageToVideo { .. }));
    } else { panic!("expected FalSora2"); }
  }

  #[test]
  fn end_frame_errors() {
    let mut b = base_builder();
    b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
    assert!(build_fal_sora_2(b).is_err());
  }

  #[test]
  fn unsupported_duration_errors_with_error_out() {
    let mut b = base_builder();
    b.duration_seconds = Some(5);
    b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
    assert!(build_fal_sora_2(b).is_err());
  }
}
