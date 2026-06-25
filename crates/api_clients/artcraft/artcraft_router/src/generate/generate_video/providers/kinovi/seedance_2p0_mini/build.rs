use seedance2pro_client::generate::video::generate_seedance_2p0_mini::{
  KinoviSeedance2p0MiniAspectRatio as KinoviAspectRatio,
  KinoviSeedance2p0MiniBitrate as KinoviBitrate,
  KinoviSeedance2p0MiniBatchCount as KinoviBatchCount,
  KinoviSeedance2p0MiniOutputResolution as KinoviOutputResolution,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_bitrate::RouterBitrate;
use crate::api::router_resolution::RouterResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::kinovi::seedance_2p0_mini::draft::{KinoviSeedance2p0MiniDraftState, KinoviSeedance2p0MiniRemainingItems};
use crate::generate::generate_video::video_generation_draft::VideoGenerationDraftRequest;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

pub fn build_kinovi_seedance_2p0_mini(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let draft = do_build_kinovi_seedance_2p0_mini(builder)?;
  Ok(VideoGenerationDraftOrRequest::Draft(VideoGenerationDraftRequest::KinoviSeedance2p0Mini(draft)))
}

fn do_build_kinovi_seedance_2p0_mini(mut builder: GenerateVideoRequestBuilder) -> Result<KinoviSeedance2p0MiniDraftState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_output_resolution(builder.resolution.take(), strategy)?;
  let batch_count = plan_batch_count(builder.video_batch_count.take(), strategy)?;
  let duration_seconds = plan_duration(builder.duration_seconds.take(), strategy)?;
  let bitrate = plan_bitrate(builder.bitrate.take());
  let prompt = builder.prompt.take().unwrap_or_default();

  let unhandled_request_state = KinoviSeedance2p0MiniRemainingItems {
    start_frame: builder.start_frame.take(),
    end_frame: builder.end_frame.take(),
    reference_images: builder.reference_images.take(),
    reference_videos: builder.reference_videos.take(),
    reference_audio: builder.reference_audio.take(),
    reference_character_tokens: builder.reference_character_tokens.take(),
  };

  Ok(KinoviSeedance2p0MiniDraftState {
    aspect_ratio,
    resolution,
    batch_count,
    duration_seconds,
    bitrate,
    prompt,
    unhandled_request_state: Some(unhandled_request_state),
  })
}

// ── Plan helpers ──

// Seedance 2.0 Mini supports all six aspect ratios:
//   16:9, 21:9, 9:16, 1:1, 4:3, 3:4. All supported ratios cost the same, so
//   both upgrade and downgrade pick the nearest match.
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

// Seedance 2.0 Mini supports output resolutions: 480p and 720p only.
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

    // 1080p is not supported for Mini — handle via strategy
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

// Seedance 2.0 Mini supports batch counts of 1–8.
fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<KinoviBatchCount, ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(KinoviBatchCount::One),
    2 => Ok(KinoviBatchCount::Two),
    3 => Ok(KinoviBatchCount::Three),
    4 => Ok(KinoviBatchCount::Four),
    5 => Ok(KinoviBatchCount::Five),
    6 => Ok(KinoviBatchCount::Six),
    7 => Ok(KinoviBatchCount::Seven),
    8 => Ok(KinoviBatchCount::Eight),
    // Over the maximum of 8.
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(KinoviBatchCount::Eight),
    },
  }
}

// Seedance 2.0 Mini supports duration of 4–15 seconds.
fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<u8, ArtcraftRouterError> {
  const MIN: u16 = 4;
  const MAX: u16 = 15;
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

// Seedance 2.0 Mini bitrate: "standard" (default, field omitted) or "high".
// Bitrate does not affect cost. `Normal` and unset both map to standard (None);
// only `High` requests the higher bitrate.
fn plan_bitrate(bitrate: Option<RouterBitrate>) -> Option<KinoviBitrate> {
  match bitrate {
    Some(RouterBitrate::High) => Some(KinoviBitrate::High),
    Some(RouterBitrate::Normal) | None => None,
  }
}

#[cfg(test)]
mod tests {
  use seedance2pro_client::generate::video::generate_seedance_2p0_mini::{
    KinoviSeedance2p0MiniAspectRatio as KinoviAspectRatio,
    KinoviSeedance2p0MiniBatchCount as KinoviBatchCount,
    KinoviSeedance2p0MiniOutputResolution as KinoviOutputResolution,
  };
  use tokens::tokens::characters::CharacterToken;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::audio_list_ref::AudioListRef;
  use crate::api::character_list_ref::CharacterListRef;
  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::video_list_ref::VideoListRef;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::kinovi::seedance_2p0_mini::draft::KinoviSeedance2p0MiniDraftState;
  use crate::generate::generate_video::video_generation_draft::VideoGenerationDraftRequest;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

  use super::*;

  mod materialized_field_conversions {
    use super::*;

    #[test]
    fn prompt_is_passed_through() {
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(mini_builder()));
      assert_eq!(draft.prompt, "a cat dancing");
    }

    #[test]
    fn prompt_defaults_to_empty() {
      let builder = GenerateVideoRequestBuilder { prompt: None, ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert_eq!(draft.prompt, "");
    }

    #[test]
    fn duration_seconds_converted() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: Some(10), ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert_eq!(draft.duration_seconds, 10);
    }

    #[test]
    fn duration_defaults_to_5() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: None, ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert_eq!(draft.duration_seconds, 5);
    }

    #[test]
    fn duration_clamped_to_max() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: Some(99), ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert_eq!(draft.duration_seconds, 15);
    }
  }

  mod batch_count_conversions {
    use super::*;

    #[test]
    fn batch_counts_one_through_eight() {
      let expected = [
        (1u16, KinoviBatchCount::One),
        (2, KinoviBatchCount::Two),
        (3, KinoviBatchCount::Three),
        (4, KinoviBatchCount::Four),
        (5, KinoviBatchCount::Five),
        (6, KinoviBatchCount::Six),
        (7, KinoviBatchCount::Seven),
        (8, KinoviBatchCount::Eight),
      ];
      for (count, variant) in expected {
        let builder = GenerateVideoRequestBuilder { video_batch_count: Some(count), ..mini_builder() };
        let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
        assert!(
          std::mem::discriminant(&draft.batch_count) == std::mem::discriminant(&variant),
          "batch {count} mapped wrong",
        );
      }
    }

    #[test]
    fn batch_over_max_downgrades_to_eight() {
      let builder = GenerateVideoRequestBuilder {
        video_batch_count: Some(12),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
        ..mini_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert!(matches!(draft.batch_count, KinoviBatchCount::Eight));
    }

    #[test]
    fn batch_over_max_error_out() {
      let builder = GenerateVideoRequestBuilder {
        video_batch_count: Some(12),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..mini_builder()
      };
      assert!(build_kinovi_seedance_2p0_mini(builder).is_err());
    }

    #[test]
    fn batch_zero_errors() {
      let builder = GenerateVideoRequestBuilder { video_batch_count: Some(0), ..mini_builder() };
      assert!(build_kinovi_seedance_2p0_mini(builder).is_err());
    }
  }

  mod aspect_ratio_conversions {
    use super::*;

    #[test]
    fn aspect_ratio_wide() {
      let builder = GenerateVideoRequestBuilder { aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine), ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Landscape16x9));
    }

    #[test]
    fn aspect_ratio_ultra_wide() {
      let builder = GenerateVideoRequestBuilder { aspect_ratio: Some(RouterAspectRatio::WideTwentyOneByNine), ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::UltraWide21x9));
    }

    #[test]
    fn aspect_ratio_tall() {
      let builder = GenerateVideoRequestBuilder { aspect_ratio: Some(RouterAspectRatio::TallNineBySixteen), ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Portrait9x16));
    }

    #[test]
    fn aspect_ratio_square() {
      let builder = GenerateVideoRequestBuilder { aspect_ratio: Some(RouterAspectRatio::Square), ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Square1x1));
    }

    #[test]
    fn aspect_ratio_four_by_three() {
      let builder = GenerateVideoRequestBuilder { aspect_ratio: Some(RouterAspectRatio::WideFourByThree), ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Standard4x3));
    }

    #[test]
    fn aspect_ratio_three_by_four() {
      let builder = GenerateVideoRequestBuilder { aspect_ratio: Some(RouterAspectRatio::TallThreeByFour), ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Portrait3x4));
    }

    #[test]
    fn aspect_ratio_defaults_to_landscape() {
      let builder = GenerateVideoRequestBuilder { aspect_ratio: None, ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Landscape16x9));
    }
  }

  mod resolution_conversions {
    use super::*;

    #[test]
    fn resolution_480p() {
      let builder = GenerateVideoRequestBuilder { resolution: Some(RouterResolution::FourEightyP), ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert!(matches!(draft.resolution, Some(KinoviOutputResolution::FourEightyP)));
    }

    #[test]
    fn resolution_720p() {
      let builder = GenerateVideoRequestBuilder { resolution: Some(RouterResolution::SevenTwentyP), ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert!(matches!(draft.resolution, Some(KinoviOutputResolution::SevenTwentyP)));
    }

    #[test]
    fn resolution_1080p_downgrades_to_720p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(RouterResolution::TenEightyP),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
        ..mini_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert!(matches!(draft.resolution, Some(KinoviOutputResolution::SevenTwentyP)));
    }

    #[test]
    fn resolution_1080p_error_out() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(RouterResolution::TenEightyP),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..mini_builder()
      };
      assert!(build_kinovi_seedance_2p0_mini(builder).is_err());
    }

    #[test]
    fn resolution_none() {
      let builder = GenerateVideoRequestBuilder { resolution: None, ..mini_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      assert!(draft.resolution.is_none());
    }
  }

  mod unhandled_request_state {
    use super::*;

    #[test]
    fn media_refs_placed_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::Url("https://example.com/start.jpg".to_string())),
        end_frame: Some(ImageRef::Url("https://example.com/end.jpg".to_string())),
        reference_images: Some(ImageListRef::Urls(vec!["https://example.com/ref.jpg".to_string()])),
        reference_videos: Some(VideoListRef::Urls(vec!["https://example.com/vid.mp4".to_string()])),
        reference_audio: Some(AudioListRef::Urls(vec!["https://example.com/audio.mp3".to_string()])),
        reference_character_tokens: Some(CharacterListRef::CharacterTokens(vec![
          CharacterToken::new("char_abc".to_string()),
        ])),
        ..mini_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(remaining.start_frame.is_some());
      assert!(remaining.end_frame.is_some());
      assert!(remaining.reference_images.is_some());
      assert!(remaining.reference_videos.is_some());
      assert!(remaining.reference_audio.is_some());
      assert!(remaining.reference_character_tokens.is_some());
    }

    #[test]
    fn start_frame_media_token_placed_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_test123".to_string()))),
        ..mini_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(matches!(remaining.start_frame, Some(ImageRef::MediaFileToken(t)) if t.as_str() == "mf_test123"));
    }

    #[test]
    fn empty_refs_are_none_in_unhandled() {
      let draft = unwrap_draft(build_kinovi_seedance_2p0_mini(mini_builder()));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(remaining.start_frame.is_none());
      assert!(remaining.end_frame.is_none());
      assert!(remaining.reference_images.is_none());
      assert!(remaining.reference_videos.is_none());
      assert!(remaining.reference_audio.is_none());
      assert!(remaining.reference_character_tokens.is_none());
    }
  }

  // ── Helpers ──

  fn mini_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p0Mini,
      provider: RouterProvider::Seedance2Pro,
      prompt: Some("a cat dancing".to_string()),
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn unwrap_draft(result: Result<VideoGenerationDraftOrRequest, ArtcraftRouterError>) -> KinoviSeedance2p0MiniDraftState {
    match result.expect("build should succeed") {
      VideoGenerationDraftOrRequest::Draft(
        VideoGenerationDraftRequest::KinoviSeedance2p0Mini(draft)
      ) => draft,
      _ => panic!("expected KinoviSeedance2p0Mini draft"),
    }
  }
}
