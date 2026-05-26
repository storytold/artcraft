use fal_client::requests::webhook::video::image::enqueue_veo_2_image_to_video_webhook::{
  Veo2AspectRatio, Veo2Duration, Veo2Request,
};
use fal_client::requests::webhook::video::text::enqueue_veo_2_text_to_video_webhook::Veo2TextToVideoRequest;

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::fal::veo_2::request::{FalVeo2Mode, FalVeo2RequestState};
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_fal_veo_2(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  if builder.end_frame.is_some() {
    return Err(unsupported("end_frame", "Veo 2 does not support an ending frame"));
  }

  let prompt = builder.prompt.clone().unwrap_or_default();
  let negative_prompt = builder.negative_prompt.clone();
  let duration = plan_duration(builder.duration_seconds, strategy)?;

  let mode = match builder.start_frame.clone() {
    Some(ImageRef::Url(url)) => FalVeo2Mode::ImageToVideo(Veo2Request {
      image_url: url,
      prompt,
      duration,
    }),
    Some(ImageRef::MediaFileToken(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls));
    }
    None => {
      let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
      FalVeo2Mode::TextToVideo(Veo2TextToVideoRequest {
        prompt,
        negative_prompt,
        duration,
        aspect_ratio,
      })
    }
  };

  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo2(
    FalVeo2RequestState { mode },
  )))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Veo2AspectRatio, ArtcraftRouterError> {
  use Veo2AspectRatio as Ar;
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Ar::Auto),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Ar::WideSixteenNine),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Ar::TallNineSixteen),

    Some(unsupported_ar) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", unsupported_ar)))
      }
      _ => Ok(Ar::Auto),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Veo2Duration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(Veo2Duration::Default),
    Some(5) => Ok(Veo2Duration::FiveSeconds),
    Some(6) => Ok(Veo2Duration::SixSeconds),
    Some(7) => Ok(Veo2Duration::SevenSeconds),
    Some(8) => Ok(Veo2Duration::EightSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("duration_seconds", &format!("{}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Veo2Duration::EightSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Veo2Duration::FiveSeconds),
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
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo2,
      provider: Provider::Fal,
      prompt: Some("a corgi running".to_string()),
      ..Default::default()
    }
  }

  fn t2v_request(b: GenerateVideoRequestBuilder) -> Veo2TextToVideoRequest {
    match build_fal_veo_2(b).expect("build_fal_veo_2") {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo2(state)) => match state.mode {
        FalVeo2Mode::TextToVideo(r) => r,
        FalVeo2Mode::ImageToVideo(_) => panic!("expected TextToVideo"),
      },
      _ => panic!("expected FalVeo2 request"),
    }
  }

  fn i2v_request(b: GenerateVideoRequestBuilder) -> Veo2Request {
    match build_fal_veo_2(b).expect("build_fal_veo_2") {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo2(state)) => match state.mode {
        FalVeo2Mode::ImageToVideo(r) => r,
        FalVeo2Mode::TextToVideo(_) => panic!("expected ImageToVideo"),
      },
      _ => panic!("expected FalVeo2 request"),
    }
  }

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
      assert!(build_fal_veo_2(b).is_err());
    }

    #[test]
    fn media_file_token_for_start_frame_errors() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_x".to_string())));
      assert!(build_fal_veo_2(b).is_err());
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
    fn duration_none_is_default() {
      assert!(matches!(t2v_request(base_builder()).duration, Veo2Duration::Default));
    }

    #[test]
    fn duration_5_through_8() {
      for (seconds, expected) in [
        (5, Veo2Duration::FiveSeconds),
        (6, Veo2Duration::SixSeconds),
        (7, Veo2Duration::SevenSeconds),
        (8, Veo2Duration::EightSeconds),
      ] {
        let mut b = base_builder();
        b.duration_seconds = Some(seconds);
        let got = t2v_request(b).duration;
        assert_eq!(format!("{:?}", got), format!("{:?}", expected));
      }
    }

    #[test]
    fn unsupported_duration_errors_with_error_out() {
      let mut b = base_builder();
      b.duration_seconds = Some(10);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_veo_2(b).is_err());
    }

    #[test]
    fn unsupported_duration_upgrades_with_pay_more() {
      let mut b = base_builder();
      b.duration_seconds = Some(20);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      assert!(matches!(t2v_request(b).duration, Veo2Duration::EightSeconds));
    }

    #[test]
    fn unsupported_duration_downgrades_with_pay_less() {
      let mut b = base_builder();
      b.duration_seconds = Some(2);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      assert!(matches!(t2v_request(b).duration, Veo2Duration::FiveSeconds));
    }
  }

  mod aspect_ratio_conversions {
    use super::*;
    use crate::api::common_aspect_ratio::CommonAspectRatio;

    #[test]
    fn t2v_auto() {
      let mut b = base_builder();
      b.aspect_ratio = Some(CommonAspectRatio::Auto);
      assert!(matches!(t2v_request(b).aspect_ratio, Veo2AspectRatio::Auto));
    }

    #[test]
    fn t2v_sixteen_nine() {
      let mut b = base_builder();
      b.aspect_ratio = Some(CommonAspectRatio::WideSixteenByNine);
      assert!(matches!(t2v_request(b).aspect_ratio, Veo2AspectRatio::WideSixteenNine));
    }

    #[test]
    fn t2v_unsupported_aspect_ratio_falls_back_with_pay_more() {
      let mut b = base_builder();
      b.aspect_ratio = Some(CommonAspectRatio::Square);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      assert!(matches!(t2v_request(b).aspect_ratio, Veo2AspectRatio::Auto));
    }

    #[test]
    fn t2v_unsupported_aspect_ratio_errors_with_error_out() {
      let mut b = base_builder();
      b.aspect_ratio = Some(CommonAspectRatio::Square);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_veo_2(b).is_err());
    }
  }

  #[test]
  fn full_combinatorial_pass() {
    use crate::api::common_aspect_ratio::CommonAspectRatio;
    let aspect_ratios = [None, Some(CommonAspectRatio::Auto), Some(CommonAspectRatio::WideSixteenByNine), Some(CommonAspectRatio::TallNineBySixteen)];
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
          assert!(build_fal_veo_2(b).is_ok());
          combos += 1;
        }
      }
    }
    assert_eq!(combos, 4 * 5 * 2);
  }
}
