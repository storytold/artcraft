use seedance2pro_client::generate::video::generate_happy_horse_1p0::{
  KinoviHappyHorse1p0AspectRatio, KinoviHappyHorse1p0BatchCount,
  KinoviHappyHorse1p0OutputResolution,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::draft::{
  KinoviHappyHorse1p0DraftState, KinoviHappyHorse1p0RemainingItems,
};
use crate::generate::generate_video_v2::video_generation_draft::VideoGenerationDraftRequest;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

pub fn build_kinovi_happy_horse_1p0(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let draft = do_build(builder)?;
  Ok(VideoGenerationDraftOrRequest::Draft(VideoGenerationDraftRequest::KinoviHappyHorse1p0(draft)))
}

fn do_build(mut builder: GenerateVideoRequestBuilder) -> Result<KinoviHappyHorse1p0DraftState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_output_resolution(builder.resolution.take(), strategy)?;
  let batch_count = plan_batch_count(builder.video_batch_count.take(), strategy)?;
  let duration_seconds = plan_duration(builder.duration_seconds.take(), strategy)?;
  let prompt = builder.prompt.take().unwrap_or_default();

  let unhandled_request_state = KinoviHappyHorse1p0RemainingItems {
    start_frame: builder.start_frame.take(),
  };

  Ok(KinoviHappyHorse1p0DraftState {
    prompt,
    aspect_ratio,
    resolution,
    duration_seconds,
    batch_count,
    unhandled_request_state: Some(unhandled_request_state),
  })
}

// ── Plan helpers ──

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<KinoviHappyHorse1p0AspectRatio>, ArtcraftRouterError> {
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(None),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(Some(KinoviHappyHorse1p0AspectRatio::Landscape16x9))
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(Some(KinoviHappyHorse1p0AspectRatio::Portrait9x16))
    }
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Ok(Some(KinoviHappyHorse1p0AspectRatio::Square1x1))
    }
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(KinoviHappyHorse1p0AspectRatio::Landscape4x3)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(KinoviHappyHorse1p0AspectRatio::Portrait3x4)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(nearest_aspect_ratio(unsupported)))
      }
    },
  }
}

fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> KinoviHappyHorse1p0AspectRatio {
  match aspect_ratio {
    CommonAspectRatio::WideFiveByFour => KinoviHappyHorse1p0AspectRatio::Landscape4x3,
    CommonAspectRatio::WideThreeByTwo => KinoviHappyHorse1p0AspectRatio::Landscape4x3,
    CommonAspectRatio::WideTwentyOneByNine => KinoviHappyHorse1p0AspectRatio::Landscape16x9,
    CommonAspectRatio::TallFourByFive => KinoviHappyHorse1p0AspectRatio::Portrait3x4,
    CommonAspectRatio::TallTwoByThree => KinoviHappyHorse1p0AspectRatio::Portrait3x4,
    CommonAspectRatio::TallNineByTwentyOne => KinoviHappyHorse1p0AspectRatio::Portrait9x16,
    _ => KinoviHappyHorse1p0AspectRatio::Square1x1,
  }
}

// Happy Horse supports 720p and 1080p only (no 480p).
fn plan_output_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<KinoviHappyHorse1p0OutputResolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),

    Some(CommonResolution::SevenTwentyP) => Ok(Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP)),
    Some(CommonResolution::TenEightyP) => Ok(Some(KinoviHappyHorse1p0OutputResolution::TenEightyP)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(Some(KinoviHappyHorse1p0OutputResolution::TenEightyP))
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP))
      }
    },
  }
}

fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<KinoviHappyHorse1p0BatchCount>, ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(None),
    2 => Ok(Some(KinoviHappyHorse1p0BatchCount::Two)),
    4 => Ok(Some(KinoviHappyHorse1p0BatchCount::Four)),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(Some(if count >= 4 { KinoviHappyHorse1p0BatchCount::Four } else { KinoviHappyHorse1p0BatchCount::Two }))
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(if count <= 2 { KinoviHappyHorse1p0BatchCount::Two } else { KinoviHappyHorse1p0BatchCount::Four }))
      }
    },
  }
}

// Happy Horse supports 4–15 seconds, defaults to 5.
fn plan_duration(
  duration_seconds: Option<u16>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Result<u8, ArtcraftRouterError> {
  let seconds = duration_seconds.unwrap_or(5);
  Ok(seconds.clamp(4, 15) as u8)
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::errors::artcraft_router_error::ArtcraftRouterError;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::video_generation_draft::VideoGenerationDraftRequest;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

  use super::*;

  // ── Materialized field conversions ──

  mod materialized_field_conversions {
    use super::*;

    #[test]
    fn prompt_is_passed_through() {
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(happy_horse_builder()));
      assert_eq!(draft.prompt, "a cat dancing");
    }

    #[test]
    fn prompt_defaults_to_empty() {
      let builder = GenerateVideoRequestBuilder { prompt: None, ..happy_horse_builder() };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert_eq!(draft.prompt, "");
    }

    #[test]
    fn duration_seconds_converted() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: Some(10), ..happy_horse_builder() };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert_eq!(draft.duration_seconds, 10);
    }

    #[test]
    fn duration_defaults_to_5() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: None, ..happy_horse_builder() };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert_eq!(draft.duration_seconds, 5);
    }

    #[test]
    fn duration_clamped_to_max() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: Some(99), ..happy_horse_builder() };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert_eq!(draft.duration_seconds, 15);
    }

    #[test]
    fn batch_count_none_for_one() {
      let builder = GenerateVideoRequestBuilder { video_batch_count: Some(1), ..happy_horse_builder() };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(draft.batch_count.is_none());
    }

    #[test]
    fn batch_count_two() {
      let builder = GenerateVideoRequestBuilder { video_batch_count: Some(2), ..happy_horse_builder() };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(matches!(draft.batch_count, Some(KinoviHappyHorse1p0BatchCount::Two)));
    }

    #[test]
    fn batch_count_four() {
      let builder = GenerateVideoRequestBuilder { video_batch_count: Some(4), ..happy_horse_builder() };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(matches!(draft.batch_count, Some(KinoviHappyHorse1p0BatchCount::Four)));
    }
  }

  // ── Aspect ratio conversions ──

  mod aspect_ratio_conversions {
    use super::*;

    #[test]
    fn aspect_ratio_wide() {
      let builder = GenerateVideoRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..happy_horse_builder()
      };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(matches!(draft.aspect_ratio, Some(KinoviHappyHorse1p0AspectRatio::Landscape16x9)));
    }

    #[test]
    fn aspect_ratio_tall() {
      let builder = GenerateVideoRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
        ..happy_horse_builder()
      };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(matches!(draft.aspect_ratio, Some(KinoviHappyHorse1p0AspectRatio::Portrait9x16)));
    }

    #[test]
    fn aspect_ratio_square() {
      let builder = GenerateVideoRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::Square),
        ..happy_horse_builder()
      };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(matches!(draft.aspect_ratio, Some(KinoviHappyHorse1p0AspectRatio::Square1x1)));
    }

    #[test]
    fn aspect_ratio_none_defaults_to_none() {
      let builder = GenerateVideoRequestBuilder { aspect_ratio: None, ..happy_horse_builder() };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(draft.aspect_ratio.is_none());
    }

    #[test]
    fn aspect_ratio_auto_defaults_to_none() {
      let builder = GenerateVideoRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::Auto),
        ..happy_horse_builder()
      };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(draft.aspect_ratio.is_none());
    }

    #[test]
    fn unsupported_aspect_ratio_falls_back() {
      let builder = GenerateVideoRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::WideFiveByFour),
        ..happy_horse_builder()
      };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(matches!(draft.aspect_ratio, Some(KinoviHappyHorse1p0AspectRatio::Landscape4x3)));
    }

    #[test]
    fn unsupported_aspect_ratio_errors_out() {
      let builder = GenerateVideoRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::WideFiveByFour),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..happy_horse_builder()
      };
      assert!(build_kinovi_happy_horse_1p0(builder).is_err());
    }
  }

  // ── Resolution conversions ──

  mod resolution_conversions {
    use super::*;

    #[test]
    fn resolution_720p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::SevenTwentyP),
        ..happy_horse_builder()
      };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(matches!(draft.resolution, Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP)));
    }

    #[test]
    fn resolution_1080p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::TenEightyP),
        ..happy_horse_builder()
      };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(matches!(draft.resolution, Some(KinoviHappyHorse1p0OutputResolution::TenEightyP)));
    }

    #[test]
    fn resolution_none() {
      let builder = GenerateVideoRequestBuilder { resolution: None, ..happy_horse_builder() };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(draft.resolution.is_none());
    }

    #[test]
    fn unsupported_resolution_error_out() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::FourEightyP),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..happy_horse_builder()
      };
      assert!(build_kinovi_happy_horse_1p0(builder).is_err());
    }

    #[test]
    fn unsupported_resolution_upgrades() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::FourK),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..happy_horse_builder()
      };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(matches!(draft.resolution, Some(KinoviHappyHorse1p0OutputResolution::TenEightyP)));
    }

    #[test]
    fn unsupported_resolution_downgrades() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::FourK),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
        ..happy_horse_builder()
      };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      assert!(matches!(draft.resolution, Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP)));
    }
  }

  // ── unhandled_request_state ──

  mod unhandled_request_state {
    use super::*;

    #[test]
    fn unhandled_state_is_present() {
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(happy_horse_builder()));
      assert!(draft.unhandled_request_state.is_some());
    }

    #[test]
    fn start_frame_url_placed_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::Url("https://example.com/start.jpg".to_string())),
        ..happy_horse_builder()
      };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(matches!(remaining.start_frame, Some(ImageRef::Url(url)) if url == "https://example.com/start.jpg"));
    }

    #[test]
    fn start_frame_media_token_placed_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_test123".to_string()))),
        ..happy_horse_builder()
      };
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(matches!(remaining.start_frame, Some(ImageRef::MediaFileToken(t)) if t.as_str() == "mf_test123"));
    }

    #[test]
    fn empty_refs_are_none_in_unhandled() {
      let draft = unwrap_draft(build_kinovi_happy_horse_1p0(happy_horse_builder()));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(remaining.start_frame.is_none());
    }
  }

  // ── Full combination ──

  #[test]
  fn full_request_all_fields() {
    let builder = GenerateVideoRequestBuilder {
      prompt: Some("full test".to_string()),
      aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
      resolution: Some(CommonResolution::TenEightyP),
      duration_seconds: Some(10),
      video_batch_count: Some(4),
      start_frame: Some(ImageRef::Url("https://example.com/start.jpg".to_string())),
      ..happy_horse_builder()
    };
    let draft = unwrap_draft(build_kinovi_happy_horse_1p0(builder));

    assert_eq!(draft.prompt, "full test");
    assert!(matches!(draft.aspect_ratio, Some(KinoviHappyHorse1p0AspectRatio::Portrait9x16)));
    assert!(matches!(draft.resolution, Some(KinoviHappyHorse1p0OutputResolution::TenEightyP)));
    assert_eq!(draft.duration_seconds, 10);
    assert!(matches!(draft.batch_count, Some(KinoviHappyHorse1p0BatchCount::Four)));

    let remaining = draft.unhandled_request_state.unwrap();
    assert!(remaining.start_frame.is_some());
  }

  // ── Helpers ──

  fn happy_horse_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      provider: Provider::Seedance2Pro,
      prompt: Some("a cat dancing".to_string()),
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn unwrap_draft(result: Result<VideoGenerationDraftOrRequest, ArtcraftRouterError>) -> KinoviHappyHorse1p0DraftState {
    match result.expect("build should succeed") {
      VideoGenerationDraftOrRequest::Draft(
        VideoGenerationDraftRequest::KinoviHappyHorse1p0(draft)
      ) => draft,
      _ => panic!("expected KinoviHappyHorse1p0 draft"),
    }
  }
}
