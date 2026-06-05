use fal_client::requests_old::webhook::video::image::enqueue_veo_3_fast_image_to_video_webhook::{
  Veo3FastAspectRatio, Veo3FastDuration, Veo3FastRequest, Veo3FastResolution,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::veo_3_fast::request::FalVeo3FastRequestState;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_fal_veo_3_fast(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let start_frame_url = require_url(builder.start_frame.clone())?;
  if builder.end_frame.is_some() {
    return Err(unsupported("end_frame", "Veo 3 Fast does not support an ending frame"));
  }

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let resolution = plan_resolution(builder.resolution, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  let generate_audio = builder.generate_audio.unwrap_or(true);

  let request = Veo3FastRequest {
    prompt: builder.prompt.clone().unwrap_or_default(),
    image_url: start_frame_url,
    aspect_ratio,
    duration,
    resolution,
    generate_audio,
  };

  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo3Fast(
    FalVeo3FastRequestState { request },
  )))
}

fn require_url(image_ref: Option<ImageRef>) -> Result<String, ArtcraftRouterError> {
  match image_ref {
    Some(ImageRef::Url(url)) => Ok(url),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
    None => Err(unsupported("start_frame", "Veo 3 Fast requires a starting frame")),
  }
}

fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Veo3FastAspectRatio, ArtcraftRouterError> {
  use Veo3FastAspectRatio as Ar;
  match aspect_ratio {
    None
    | Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
    | Some(RouterAspectRatio::Auto4k) => Ok(Ar::Auto),

    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Ar::WideSixteenNine),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Ar::TallNineSixteen),

    Some(unsupported_ar) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", unsupported_ar)))
      }
      _ => Ok(Ar::Auto),
    },
  }
}

fn plan_resolution(
  resolution: Option<RouterResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Veo3FastResolution, ArtcraftRouterError> {
  use Veo3FastResolution as R;
  match resolution {
    None => Ok(R::Default),
    Some(RouterResolution::SevenTwentyP) => Ok(R::SevenTwentyP),
    Some(RouterResolution::TenEightyP) => Ok(R::TenEightyP),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("resolution", &format!("{:?}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(R::TenEightyP),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(R::SevenTwentyP),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Veo3FastDuration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Veo3FastDuration::Default),
    Some(4) => Ok(Veo3FastDuration::FourSeconds),
    Some(6) => Ok(Veo3FastDuration::SixSeconds),
    Some(8) => Ok(Veo3FastDuration::EightSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("duration_seconds", &format!("{}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Veo3FastDuration::EightSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Veo3FastDuration::FourSeconds),
    },
  }
}

fn unsupported(field: &'static str, value: &str) -> ArtcraftRouterError {
  ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
    field,
    value: value.to_string(),
  })
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3Fast,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      start_frame: Some(ImageRef::Url("https://example.com/a.png".to_string())),
      ..Default::default()
    }
  }

  fn unwrap(b: GenerateVideoRequestBuilder) -> Veo3FastRequest {
    match build_fal_veo_3_fast(b).expect("build") {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo3Fast(s)) => s.request,
      _ => panic!("expected FalVeo3Fast"),
    }
  }

  #[test]
  fn missing_start_frame_errors() {
    let mut b = base_builder();
    b.start_frame = None;
    assert!(build_fal_veo_3_fast(b).is_err());
  }

  #[test]
  fn end_frame_errors() {
    let mut b = base_builder();
    b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
    assert!(build_fal_veo_3_fast(b).is_err());
  }

  #[test]
  fn prompt_passed_through() {
    let mut b = base_builder();
    b.prompt = Some("hello world".to_string());
    assert_eq!(unwrap(b).prompt, "hello world");
  }

  #[test]
  fn audio_defaults_to_true() {
    assert!(unwrap(base_builder()).generate_audio);
  }

  #[test]
  fn audio_false_passed_through() {
    let mut b = base_builder();
    b.generate_audio = Some(false);
    assert!(!unwrap(b).generate_audio);
  }

  #[test]
  fn full_combinatorial_pass() {
    let resolutions = [None, Some(RouterResolution::SevenTwentyP), Some(RouterResolution::TenEightyP)];
    let durations = [None, Some(4u16), Some(6), Some(8)];
    let aspect_ratios = [None, Some(RouterAspectRatio::Auto), Some(RouterAspectRatio::WideSixteenByNine), Some(RouterAspectRatio::TallNineBySixteen)];
    let audios = [None, Some(true), Some(false)];

    let mut combos = 0;
    for &resolution in &resolutions {
      for &duration in &durations {
        for &aspect_ratio in &aspect_ratios {
          for &generate_audio in &audios {
            let mut b = base_builder();
            b.resolution = resolution;
            b.duration_seconds = duration;
            b.aspect_ratio = aspect_ratio;
            b.generate_audio = generate_audio;
            assert!(build_fal_veo_3_fast(b).is_ok());
            combos += 1;
          }
        }
      }
    }
    assert_eq!(combos, 3 * 4 * 4 * 3);
  }
}
