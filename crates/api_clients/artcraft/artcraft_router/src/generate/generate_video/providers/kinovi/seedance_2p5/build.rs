use kinovi_web_client::generate::video::generate_seedance_2p5::{
  KinoviSeedance2p5AspectRatio as KinoviAspectRatio,
  KinoviSeedance2p5OutputResolution as KinoviOutputResolution,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::kinovi::seedance_2p5::draft::{KinoviSeedance2p5DraftState, KinoviSeedance2p5RemainingItems};
use crate::generate::generate_video::video_generation_draft::VideoGenerationDraftRequest;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

pub fn build_kinovi_seedance_2p5(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let draft = do_build_kinovi_seedance_2p5(builder)?;
  Ok(VideoGenerationDraftOrRequest::Draft(VideoGenerationDraftRequest::KinoviSeedance2p5(draft)))
}

fn do_build_kinovi_seedance_2p5(mut builder: GenerateVideoRequestBuilder) -> Result<KinoviSeedance2p5DraftState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let has_keyframes = builder.start_frame.is_some() || builder.end_frame.is_some();
  let has_references = builder.reference_images.is_some()
    || builder.reference_videos.is_some()
    || builder.reference_audio.is_some();

  // Keyframe (image-to-video) and reference modes are mutually exclusive on
  // the Seedance 2.5 API. Dropping either set would change the meaning of
  // the request, so this errors regardless of strategy.
  if has_keyframes && has_references {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_images",
      value: "Seedance 2.5 cannot combine keyframes with reference media; send one or the other".to_string(),
    }));
  }

  // An end frame requires a start frame.
  if builder.end_frame.is_some() && builder.start_frame.is_none() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Seedance 2.5 requires a start frame when an end frame is set".to_string(),
    }));
  }

  // Kinovi character references are not supported by the 2.5 API.
  if builder.reference_character_tokens.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_character_tokens",
      value: "Seedance 2.5 does not support character references".to_string(),
    }));
  }

  // Keyframe mode only supports "Adaptive" (the aspect ratio follows the
  // input frames), so any explicit aspect ratio preference is ignored there.
  // The planned value below only applies to reference mode.
  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_output_resolution(builder.resolution.take(), strategy)?;
  plan_batch_count(builder.video_batch_count.take(), strategy)?;
  let duration_seconds = plan_duration(builder.duration_seconds.take(), strategy)?;
  let prompt = builder.prompt.take().unwrap_or_default();

  let total_input_seconds = builder.total_reference_video_input_seconds
    .map(|seconds| u8::try_from(seconds).unwrap_or(u8::MAX));

  // NB: `builder.bitrate` is intentionally ignored — 2.5 has no bitrate
  // option (and bitrate never affects cost).

  let unhandled_request_state = KinoviSeedance2p5RemainingItems {
    start_frame: builder.start_frame.take(),
    end_frame: builder.end_frame.take(),
    reference_images: builder.reference_images.take(),
    reference_videos: builder.reference_videos.take(),
    reference_audio: builder.reference_audio.take(),
  };

  Ok(KinoviSeedance2p5DraftState {
    aspect_ratio,
    resolution,
    duration_seconds,
    prompt,
    total_input_seconds,
    unhandled_request_state: Some(unhandled_request_state),
  })
}

// ── Plan helpers ──

// Seedance 2.5 reference mode supports all six aspect ratios:
//   16:9, 21:9, 9:16, 1:1, 4:3, 3:4. All supported ratios cost the same, so
//   both upgrade and downgrade pick the nearest match. (Keyframe mode is
//   always Adaptive and ignores this entirely.)
fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<KinoviAspectRatio, ArtcraftRouterError> {
  match aspect_ratio {
    // No preference or auto — default to landscape
    None
    | Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto4k) => Ok(KinoviAspectRatio::Landscape16x9),

    // Direct mappings
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => {
      Ok(KinoviAspectRatio::Landscape16x9)
    }
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => {
      Ok(KinoviAspectRatio::Portrait9x16)
    }
    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => {
      Ok(KinoviAspectRatio::Square1x1)
    }
    Some(RouterAspectRatio::WideFourByThree) => Ok(KinoviAspectRatio::Standard4x3),
    Some(RouterAspectRatio::TallThreeByFour) => Ok(KinoviAspectRatio::Portrait3x4),
    Some(RouterAspectRatio::WideTwentyOneByNine) => Ok(KinoviAspectRatio::UltraWide21x9),

    // Mismatches — apply strategy
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(nearest_aspect_ratio(unsupported))
      }
    },
  }
}

/// Pick the nearest supported aspect ratio by AR value (width / height).
fn nearest_aspect_ratio(aspect_ratio: RouterAspectRatio) -> KinoviAspectRatio {
  match aspect_ratio {
    RouterAspectRatio::WideFiveByFour => KinoviAspectRatio::Standard4x3,         // 1.25, nearest 1.33
    RouterAspectRatio::WideThreeByTwo => KinoviAspectRatio::Standard4x3,         // 1.50, nearest 1.33
    RouterAspectRatio::TallFourByFive => KinoviAspectRatio::Portrait3x4,         // 0.80, nearest 0.75
    RouterAspectRatio::TallTwoByThree => KinoviAspectRatio::Portrait3x4,         // 0.67, nearest 0.75
    RouterAspectRatio::TallNineByTwentyOne => KinoviAspectRatio::Portrait9x16,   // 0.43, nearest 0.56
    _ => KinoviAspectRatio::Square1x1,
  }
}

// Seedance 2.5 supports output resolutions: 480p and 720p only.
// 1080p (and higher) is NOT supported — downgrade to 720p or error based on strategy.
fn plan_output_resolution(
  resolution: Option<RouterResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<KinoviOutputResolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),

    // Direct mappings
    Some(RouterResolution::FourEightyP) => Ok(Some(KinoviOutputResolution::FourEightyP)),
    Some(RouterResolution::SevenTwentyP) => Ok(Some(KinoviOutputResolution::SevenTwentyP)),

    // 1080p is not supported — handle via strategy
    Some(RouterResolution::TenEightyP) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", RouterResolution::TenEightyP),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        // 1080p not available — downgrade to 720p (highest supported)
        Ok(Some(KinoviOutputResolution::SevenTwentyP))
      }
    },

    // Other unsupported resolutions
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(match unsupported {
          RouterResolution::HalfK => KinoviOutputResolution::FourEightyP,
          _ => KinoviOutputResolution::SevenTwentyP,
        }))
      }
    },
  }
}

// Seedance 2.5 generates a single video per request (no batching).
fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<(), ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(()),
    // Over the maximum of 1.
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(()),
    },
  }
}

// Seedance 2.5 supports durations of 4–30 seconds.
fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<u8, ArtcraftRouterError> {
  const MIN: u16 = 4;
  const MAX: u16 = 30;
  const DEFAULT: u8 = 5;
  match duration_seconds {
    None => Ok(DEFAULT),
    Some(d) if d >= MIN && d <= MAX => Ok(d as u8),
    Some(d) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(d.clamp(MIN, MAX) as u8),
    },
  }
}

#[cfg(test)]
mod tests {
  use kinovi_web_client::generate::video::generate_seedance_2p5::{
    KinoviSeedance2p5AspectRatio as KinoviAspectRatio,
    KinoviSeedance2p5OutputResolution as KinoviOutputResolution,
  };
  use tokens::tokens::characters::CharacterToken;

  use crate::api::character_list_ref::CharacterListRef;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::video_list_ref::VideoListRef;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::kinovi::seedance_2p5::draft::KinoviSeedance2p5DraftState;
  use crate::generate::generate_video::video_generation_draft::VideoGenerationDraftRequest;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

  use super::*;

  mod materialized_field_conversions {
    use super::*;

    #[test]
    fn prompt_is_passed_through() {
      let draft = unwrap_draft(build_kinovi_seedance_2p5(base_builder()));
      assert_eq!(draft.prompt, "a cat dancing");
    }

    #[test]
    fn duration_defaults_to_5() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: None, ..base_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p5(builder));
      assert_eq!(draft.duration_seconds, 5);
    }

    #[test]
    fn duration_clamped_to_range() {
      let over = GenerateVideoRequestBuilder { duration_seconds: Some(99), ..base_builder() };
      assert_eq!(unwrap_draft(build_kinovi_seedance_2p5(over)).duration_seconds, 30);

      let under = GenerateVideoRequestBuilder { duration_seconds: Some(2), ..base_builder() };
      assert_eq!(unwrap_draft(build_kinovi_seedance_2p5(under)).duration_seconds, 4);
    }

    #[test]
    fn total_input_seconds_is_carried_through() {
      let builder = GenerateVideoRequestBuilder {
        total_reference_video_input_seconds: Some(14),
        ..base_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p5(builder));
      assert_eq!(draft.total_input_seconds, Some(14));
    }

    #[test]
    fn total_input_seconds_saturates_at_u8_max() {
      let builder = GenerateVideoRequestBuilder {
        total_reference_video_input_seconds: Some(9_999),
        ..base_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p5(builder));
      assert_eq!(draft.total_input_seconds, Some(u8::MAX));
    }
  }

  mod modality_rules {
    use super::*;

    #[test]
    fn keyframes_are_accepted() {
      let builder = GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::Url("https://example.com/start.jpg".to_string())),
        end_frame: Some(ImageRef::Url("https://example.com/end.jpg".to_string())),
        ..base_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p5(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(remaining.start_frame.is_some());
      assert!(remaining.end_frame.is_some());
    }

    #[test]
    fn start_frame_alone_is_accepted() {
      let builder = GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::Url("https://example.com/start.jpg".to_string())),
        ..base_builder()
      };
      assert!(build_kinovi_seedance_2p5(builder).is_ok());
    }

    #[test]
    fn end_frame_without_start_frame_errors() {
      let builder = GenerateVideoRequestBuilder {
        end_frame: Some(ImageRef::Url("https://example.com/end.jpg".to_string())),
        ..base_builder()
      };
      assert!(build_kinovi_seedance_2p5(builder).is_err());
    }

    #[test]
    fn keyframes_plus_references_error() {
      let builder = GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::Url("https://example.com/start.jpg".to_string())),
        reference_images: Some(ImageListRef::Urls(vec!["https://example.com/ref.jpg".to_string()])),
        ..base_builder()
      };
      assert!(build_kinovi_seedance_2p5(builder).is_err());
    }

    #[test]
    fn character_references_error() {
      let builder = GenerateVideoRequestBuilder {
        reference_character_tokens: Some(CharacterListRef::CharacterTokens(vec![
          CharacterToken::new("char_abc".to_string()),
        ])),
        ..base_builder()
      };
      assert!(build_kinovi_seedance_2p5(builder).is_err());
    }

    #[test]
    fn reference_media_lands_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        reference_images: Some(ImageListRef::Urls(vec!["https://example.com/ref.jpg".to_string()])),
        reference_videos: Some(VideoListRef::Urls(vec!["https://example.com/vid.mp4".to_string()])),
        ..base_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p5(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(remaining.reference_images.is_some());
      assert!(remaining.reference_videos.is_some());
    }
  }

  mod aspect_ratio_and_resolution {
    use super::*;

    #[test]
    fn direct_aspect_ratio_mappings() {
      let expected = [
        (RouterAspectRatio::WideSixteenByNine, KinoviAspectRatio::Landscape16x9),
        (RouterAspectRatio::WideTwentyOneByNine, KinoviAspectRatio::UltraWide21x9),
        (RouterAspectRatio::TallNineBySixteen, KinoviAspectRatio::Portrait9x16),
        (RouterAspectRatio::Square, KinoviAspectRatio::Square1x1),
        (RouterAspectRatio::WideFourByThree, KinoviAspectRatio::Standard4x3),
        (RouterAspectRatio::TallThreeByFour, KinoviAspectRatio::Portrait3x4),
      ];
      for (input, output) in expected {
        let builder = GenerateVideoRequestBuilder { aspect_ratio: Some(input), ..base_builder() };
        let draft = unwrap_draft(build_kinovi_seedance_2p5(builder));
        assert!(
          std::mem::discriminant(&draft.aspect_ratio) == std::mem::discriminant(&output),
          "aspect ratio {input:?} mapped wrong",
        );
      }
    }

    #[test]
    fn resolution_480p_and_720p() {
      let builder = GenerateVideoRequestBuilder { resolution: Some(RouterResolution::FourEightyP), ..base_builder() };
      assert!(matches!(unwrap_draft(build_kinovi_seedance_2p5(builder)).resolution, Some(KinoviOutputResolution::FourEightyP)));

      let builder = GenerateVideoRequestBuilder { resolution: Some(RouterResolution::SevenTwentyP), ..base_builder() };
      assert!(matches!(unwrap_draft(build_kinovi_seedance_2p5(builder)).resolution, Some(KinoviOutputResolution::SevenTwentyP)));
    }

    #[test]
    fn resolution_1080p_downgrades_to_720p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(RouterResolution::TenEightyP),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
        ..base_builder()
      };
      assert!(matches!(unwrap_draft(build_kinovi_seedance_2p5(builder)).resolution, Some(KinoviOutputResolution::SevenTwentyP)));
    }

    #[test]
    fn resolution_1080p_error_out() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(RouterResolution::TenEightyP),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..base_builder()
      };
      assert!(build_kinovi_seedance_2p5(builder).is_err());
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p5,
      provider: RouterProvider::KinoviWeb,
      prompt: Some("a cat dancing".to_string()),
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn unwrap_draft(result: Result<VideoGenerationDraftOrRequest, ArtcraftRouterError>) -> KinoviSeedance2p5DraftState {
    match result.expect("build should succeed") {
      VideoGenerationDraftOrRequest::Draft(
        VideoGenerationDraftRequest::KinoviSeedance2p5(draft)
      ) => draft,
      _ => panic!("expected KinoviSeedance2p5 draft"),
    }
  }
}
