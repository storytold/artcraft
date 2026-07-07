use fal_client::requests::api::video::image::veo_2::api::{
  Veo2ImageToVideoDuration, Veo2ImageToVideoRequest,
};
use fal_client::requests::api::video::text::veo_2::api::{
  Veo2TextToVideoAspectRatio, Veo2TextToVideoDuration, Veo2TextToVideoRequest,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::veo_2::request::{FalVeo2Mode, FalVeo2RequestState};
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

/// Router-level duration plan shared by both modes — each mode maps it onto
/// its own fal duration enum.
#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanDuration {
  Five,
  Six,
  Seven,
  Eight,
}

pub fn build_fal_veo_2(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_veo_2_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo2(state)))
}

pub(crate) fn build_fal_veo_2_state(
  builder: GenerateVideoRequestBuilder,
) -> Result<FalVeo2RequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  if builder.end_frame.is_some() {
    return Err(unsupported("end_frame", "Veo 2 does not support an ending frame"));
  }

  let prompt = builder.prompt.clone().unwrap_or_default();
  let negative_prompt = builder.negative_prompt.clone();
  let duration = plan_duration(builder.duration_seconds, strategy)?;

  let mode = match builder.start_frame.clone() {
    Some(ImageRef::Url(url)) => FalVeo2Mode::ImageToVideo(Veo2ImageToVideoRequest {
      prompt,
      image_url: url,
      duration: duration.map(to_i2v_duration),
    }),
    Some(ImageRef::MediaFileToken(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls));
    }
    None => {
      let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
      FalVeo2Mode::TextToVideo(Veo2TextToVideoRequest {
        prompt,
        aspect_ratio,
        duration: duration.map(to_t2v_duration),
        negative_prompt,
        enhance_prompt: None,
        seed: None,
        auto_fix: None,
      })
    }
  };

  Ok(FalVeo2RequestState { mode })
}

/// `None` lets fal pick its default (16:9); the old endpoint's explicit "auto"
/// no longer exists in the new API, so Auto maps to unset.
fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Veo2TextToVideoAspectRatio>, ArtcraftRouterError> {
  use Veo2TextToVideoAspectRatio as Ar;
  match aspect_ratio {
    None
    | Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
    | Some(RouterAspectRatio::Auto4k) => Ok(None),

    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

    Some(unsupported_ar) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", unsupported_ar)))
      }
      _ => Ok(None),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanDuration>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(5) => Ok(Some(PlanDuration::Five)),
    Some(6) => Ok(Some(PlanDuration::Six)),
    Some(7) => Ok(Some(PlanDuration::Seven)),
    Some(8) => Ok(Some(PlanDuration::Eight)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("duration_seconds", &format!("{}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(PlanDuration::Eight)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(PlanDuration::Five)),
    },
  }
}

fn unsupported(field: &'static str, value: &str) -> ArtcraftRouterError {
  ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
    field,
    value: value.to_string(),
  })
}

fn to_t2v_duration(d: PlanDuration) -> Veo2TextToVideoDuration {
  match d {
    PlanDuration::Five => Veo2TextToVideoDuration::FiveSeconds,
    PlanDuration::Six => Veo2TextToVideoDuration::SixSeconds,
    PlanDuration::Seven => Veo2TextToVideoDuration::SevenSeconds,
    PlanDuration::Eight => Veo2TextToVideoDuration::EightSeconds,
  }
}

fn to_i2v_duration(d: PlanDuration) -> Veo2ImageToVideoDuration {
  match d {
    PlanDuration::Five => Veo2ImageToVideoDuration::FiveSeconds,
    PlanDuration::Six => Veo2ImageToVideoDuration::SixSeconds,
    PlanDuration::Seven => Veo2ImageToVideoDuration::SevenSeconds,
    PlanDuration::Eight => Veo2ImageToVideoDuration::EightSeconds,
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;

  use super::*;

  mod mode_selection {
    use super::*;

    #[test]
    fn no_start_frame_picks_t2v() {
      let _ = t2v_request(base_builder());
    }

    #[test]
    fn start_frame_picks_i2v() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
      let _ = i2v_request(b);
    }

    #[test]
    fn end_frame_errors() {
      let mut b = base_builder();
      b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
      assert!(build_fal_veo_2_state(b).is_err());
    }

    #[test]
    fn media_file_token_for_start_frame_errors() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_x".to_string())));
      assert!(build_fal_veo_2_state(b).is_err());
    }
  }

  mod materialized_fields {
    use super::*;

    #[test]
    fn t2v_prompt_passed_through() {
      let mut b = base_builder();
      b.prompt = Some("hello".to_string());
      assert_eq!(t2v_request(b).prompt, "hello");
    }

    #[test]
    fn t2v_negative_prompt_passed_through() {
      let mut b = base_builder();
      b.negative_prompt = Some("no rain".to_string());
      assert_eq!(t2v_request(b).negative_prompt.as_deref(), Some("no rain"));
    }

    #[test]
    fn i2v_image_url_passed_through() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
      assert_eq!(i2v_request(b).image_url, "https://example.com/start.png");
    }
  }

  mod duration_conversions {
    use super::*;

    #[test]
    fn duration_none_is_unset() {
      // fal defaults to 5s when unset.
      assert!(t2v_request(base_builder()).duration.is_none());
    }

    #[test]
    fn duration_5_through_8() {
      for (seconds, expected) in [
        (5, Veo2TextToVideoDuration::FiveSeconds),
        (6, Veo2TextToVideoDuration::SixSeconds),
        (7, Veo2TextToVideoDuration::SevenSeconds),
        (8, Veo2TextToVideoDuration::EightSeconds),
      ] {
        let mut b = base_builder();
        b.duration_seconds = Some(seconds);
        assert_eq!(t2v_request(b).duration, Some(expected));
      }
    }

    #[test]
    fn unsupported_duration_errors_with_error_out() {
      let mut b = base_builder();
      b.duration_seconds = Some(10);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_veo_2_state(b).is_err());
    }

    #[test]
    fn unsupported_duration_upgrades_with_pay_more() {
      let mut b = base_builder();
      b.duration_seconds = Some(20);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      assert_eq!(t2v_request(b).duration, Some(Veo2TextToVideoDuration::EightSeconds));
    }

    #[test]
    fn unsupported_duration_downgrades_with_pay_less() {
      let mut b = base_builder();
      b.duration_seconds = Some(2);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      assert_eq!(t2v_request(b).duration, Some(Veo2TextToVideoDuration::FiveSeconds));
    }
  }

  mod aspect_ratio_conversions {
    use super::*;
    use crate::api::router_aspect_ratio::RouterAspectRatio;

    #[test]
    fn t2v_auto_is_unset() {
      let mut b = base_builder();
      b.aspect_ratio = Some(RouterAspectRatio::Auto);
      assert!(t2v_request(b).aspect_ratio.is_none());
    }

    #[test]
    fn t2v_sixteen_nine() {
      let mut b = base_builder();
      b.aspect_ratio = Some(RouterAspectRatio::WideSixteenByNine);
      assert_eq!(t2v_request(b).aspect_ratio, Some(Veo2TextToVideoAspectRatio::SixteenByNine));
    }

    #[test]
    fn t2v_unsupported_aspect_ratio_falls_back_with_pay_more() {
      let mut b = base_builder();
      b.aspect_ratio = Some(RouterAspectRatio::Square);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      assert!(t2v_request(b).aspect_ratio.is_none());
    }

    #[test]
    fn t2v_unsupported_aspect_ratio_errors_with_error_out() {
      let mut b = base_builder();
      b.aspect_ratio = Some(RouterAspectRatio::Square);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_veo_2_state(b).is_err());
    }
  }

  #[test]
  fn full_combinatorial_pass() {
    use crate::api::router_aspect_ratio::RouterAspectRatio;
    let aspect_ratios = [None, Some(RouterAspectRatio::Auto), Some(RouterAspectRatio::WideSixteenByNine), Some(RouterAspectRatio::TallNineBySixteen)];
    let durations = [None, Some(5u16), Some(6), Some(7), Some(8)];

    let mut combos = 0;
    for &aspect_ratio in &aspect_ratios {
      for &duration in &durations {
        for has_start_frame in [false, true] {
          let mut b = base_builder();
          b.aspect_ratio = aspect_ratio;
          b.duration_seconds = duration;
          if has_start_frame {
            b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
          }
          assert!(build_fal_veo_2_state(b).is_ok());
          combos += 1;
        }
      }
    }
    assert_eq!(combos, 4 * 5 * 2);
  }

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo2,
      provider: RouterProvider::Fal,
      prompt: Some("a corgi running".to_string()),
      ..Default::default()
    }
  }

  fn t2v_request(b: GenerateVideoRequestBuilder) -> Veo2TextToVideoRequest {
    match build_fal_veo_2_state(b).expect("build_fal_veo_2_state").mode {
      FalVeo2Mode::TextToVideo(r) => r,
      FalVeo2Mode::ImageToVideo(_) => panic!("expected TextToVideo"),
    }
  }

  fn i2v_request(b: GenerateVideoRequestBuilder) -> Veo2ImageToVideoRequest {
    match build_fal_veo_2_state(b).expect("build_fal_veo_2_state").mode {
      FalVeo2Mode::ImageToVideo(r) => r,
      FalVeo2Mode::TextToVideo(_) => panic!("expected ImageToVideo"),
    }
  }
}
