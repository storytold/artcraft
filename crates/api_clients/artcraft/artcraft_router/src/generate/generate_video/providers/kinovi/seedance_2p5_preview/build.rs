use kinovi_web_client::generate::video::generate_seedance_2p5_preview::{
  KinoviSeedance2p5PreviewAspectRatio as KinoviAspectRatio,
  KinoviSeedance2p5PreviewOutputResolution as KinoviOutputResolution,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::kinovi::seedance_2p5_preview::draft::{KinoviSeedance2p5PreviewDraftState, KinoviSeedance2p5PreviewRemainingItems};
use crate::generate::generate_video::video_generation_draft::VideoGenerationDraftRequest;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

pub fn build_kinovi_seedance_2p5_preview(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let draft = do_build_kinovi_seedance_2p5_preview(builder)?;
  Ok(VideoGenerationDraftOrRequest::Draft(VideoGenerationDraftRequest::KinoviSeedance2p5Preview(draft)))
}

fn do_build_kinovi_seedance_2p5_preview(mut builder: GenerateVideoRequestBuilder) -> Result<KinoviSeedance2p5PreviewDraftState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Seedance 2.5 Preview only operates in reference mode — there is no
  // keyframe (start/end frame) mode. Dropping a caller's frames would change
  // the meaning of the request, so this errors regardless of strategy.
  if builder.start_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "start_frame",
      value: "Seedance 2.5 Preview has no keyframe mode; use reference_images".to_string(),
    }));
  }
  if builder.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Seedance 2.5 Preview has no keyframe mode; use reference_images".to_string(),
    }));
  }

  // Kinovi character references are not supported by the 2.5 Preview API.
  if builder.reference_character_tokens.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_character_tokens",
      value: "Seedance 2.5 Preview does not support character references".to_string(),
    }));
  }

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_output_resolution(builder.resolution.take(), strategy)?;
  plan_batch_count(builder.video_batch_count.take(), strategy)?;
  let duration_seconds = plan_duration(builder.duration_seconds.take(), strategy)?;
  let prompt = builder.prompt.take().unwrap_or_default();

  // NB: `builder.bitrate` is intentionally ignored — 2.5 Preview has no
  // bitrate option (and bitrate never affects cost).

  let unhandled_request_state = KinoviSeedance2p5PreviewRemainingItems {
    reference_images: builder.reference_images.take(),
    reference_videos: builder.reference_videos.take(),
    reference_audio: builder.reference_audio.take(),
  };

  Ok(KinoviSeedance2p5PreviewDraftState {
    aspect_ratio,
    resolution,
    duration_seconds,
    prompt,
    unhandled_request_state: Some(unhandled_request_state),
  })
}

// ── Plan helpers ──

// Seedance 2.5 Preview supports all six aspect ratios:
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

// Seedance 2.5 Preview supports output resolutions: 480p and 720p only.
// 1080p (and higher) is NOT supported — downgrade to 720p or error based on strategy.
fn plan_output_resolution(
  resolution: Option<RouterResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<KinoviOutputResolution>, ArtcraftRouterError> {
  match resolution {
    // Unset defaults to explicit 720p. Cost estimation prices unset as 720p,
    // so the request must pin 720p too — never leave the resolution up to the
    // provider's server-side default, or billing and supplier cost can diverge.
    None => Ok(Some(KinoviOutputResolution::SevenTwentyP)),

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

// Seedance 2.5 Preview generates a single video per request (no batching).
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

// Seedance 2.5 Preview supports durations of 4–30 seconds.
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
  use kinovi_web_client::generate::video::generate_seedance_2p5_preview::{
    KinoviSeedance2p5PreviewAspectRatio as KinoviAspectRatio,
    KinoviSeedance2p5PreviewOutputResolution as KinoviOutputResolution,
  };
  use tokens::tokens::characters::CharacterToken;

  use crate::api::audio_list_ref::AudioListRef;
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
  use crate::generate::generate_video::providers::kinovi::seedance_2p5_preview::draft::KinoviSeedance2p5PreviewDraftState;
  use crate::generate::generate_video::video_generation_draft::VideoGenerationDraftRequest;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

  use super::*;

  mod materialized_field_conversions {
    use super::*;

    #[test]
    fn prompt_is_passed_through() {
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(preview_builder()));
      assert_eq!(draft.prompt, "a cat dancing");
    }

    #[test]
    fn prompt_defaults_to_empty() {
      let builder = GenerateVideoRequestBuilder { prompt: None, ..preview_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(builder));
      assert_eq!(draft.prompt, "");
    }

    #[test]
    fn duration_seconds_converted() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: Some(30), ..preview_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(builder));
      assert_eq!(draft.duration_seconds, 30);
    }

    #[test]
    fn duration_defaults_to_5() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: None, ..preview_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(builder));
      assert_eq!(draft.duration_seconds, 5);
    }

    #[test]
    fn duration_clamped_to_max_30() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: Some(99), ..preview_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(builder));
      assert_eq!(draft.duration_seconds, 30);
    }

    #[test]
    fn duration_clamped_to_min_4() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: Some(2), ..preview_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(builder));
      assert_eq!(draft.duration_seconds, 4);
    }

    #[test]
    fn duration_out_of_range_error_out() {
      let builder = GenerateVideoRequestBuilder {
        duration_seconds: Some(99),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..preview_builder()
      };
      assert!(build_kinovi_seedance_2p5_preview(builder).is_err());
    }
  }

  mod unsupported_option_errors {
    use super::*;

    #[test]
    fn start_frame_errors() {
      let builder = GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::Url("https://example.com/start.jpg".to_string())),
        ..preview_builder()
      };
      assert!(build_kinovi_seedance_2p5_preview(builder).is_err());
    }

    #[test]
    fn end_frame_errors() {
      let builder = GenerateVideoRequestBuilder {
        end_frame: Some(ImageRef::Url("https://example.com/end.jpg".to_string())),
        ..preview_builder()
      };
      assert!(build_kinovi_seedance_2p5_preview(builder).is_err());
    }

    #[test]
    fn character_references_error() {
      let builder = GenerateVideoRequestBuilder {
        reference_character_tokens: Some(CharacterListRef::CharacterTokens(vec![
          CharacterToken::new("char_abc".to_string()),
        ])),
        ..preview_builder()
      };
      assert!(build_kinovi_seedance_2p5_preview(builder).is_err());
    }
  }

  mod batch_count_conversions {
    use super::*;

    #[test]
    fn batch_one_is_accepted() {
      let builder = GenerateVideoRequestBuilder { video_batch_count: Some(1), ..preview_builder() };
      assert!(build_kinovi_seedance_2p5_preview(builder).is_ok());
    }

    #[test]
    fn batch_over_one_downgrades_to_single() {
      let builder = GenerateVideoRequestBuilder {
        video_batch_count: Some(4),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
        ..preview_builder()
      };
      assert!(build_kinovi_seedance_2p5_preview(builder).is_ok());
    }

    #[test]
    fn batch_over_one_error_out() {
      let builder = GenerateVideoRequestBuilder {
        video_batch_count: Some(4),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..preview_builder()
      };
      assert!(build_kinovi_seedance_2p5_preview(builder).is_err());
    }

    #[test]
    fn batch_zero_errors() {
      let builder = GenerateVideoRequestBuilder { video_batch_count: Some(0), ..preview_builder() };
      assert!(build_kinovi_seedance_2p5_preview(builder).is_err());
    }
  }

  mod aspect_ratio_conversions {
    use super::*;

    #[test]
    fn direct_mappings() {
      let expected = [
        (RouterAspectRatio::WideSixteenByNine, KinoviAspectRatio::Landscape16x9),
        (RouterAspectRatio::WideTwentyOneByNine, KinoviAspectRatio::UltraWide21x9),
        (RouterAspectRatio::TallNineBySixteen, KinoviAspectRatio::Portrait9x16),
        (RouterAspectRatio::Square, KinoviAspectRatio::Square1x1),
        (RouterAspectRatio::WideFourByThree, KinoviAspectRatio::Standard4x3),
        (RouterAspectRatio::TallThreeByFour, KinoviAspectRatio::Portrait3x4),
      ];
      for (input, output) in expected {
        let builder = GenerateVideoRequestBuilder { aspect_ratio: Some(input), ..preview_builder() };
        let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(builder));
        assert!(
          std::mem::discriminant(&draft.aspect_ratio) == std::mem::discriminant(&output),
          "aspect ratio {input:?} mapped wrong",
        );
      }
    }

    #[test]
    fn aspect_ratio_defaults_to_landscape() {
      let builder = GenerateVideoRequestBuilder { aspect_ratio: None, ..preview_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(builder));
      assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Landscape16x9));
    }
  }

  mod resolution_conversions {
    use super::*;

    #[test]
    fn resolution_480p() {
      let builder = GenerateVideoRequestBuilder { resolution: Some(RouterResolution::FourEightyP), ..preview_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(builder));
      assert!(matches!(draft.resolution, Some(KinoviOutputResolution::FourEightyP)));
    }

    #[test]
    fn resolution_720p() {
      let builder = GenerateVideoRequestBuilder { resolution: Some(RouterResolution::SevenTwentyP), ..preview_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(builder));
      assert!(matches!(draft.resolution, Some(KinoviOutputResolution::SevenTwentyP)));
    }

    #[test]
    fn resolution_1080p_downgrades_to_720p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(RouterResolution::TenEightyP),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
        ..preview_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(builder));
      assert!(matches!(draft.resolution, Some(KinoviOutputResolution::SevenTwentyP)));
    }

    #[test]
    fn resolution_1080p_error_out() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(RouterResolution::TenEightyP),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..preview_builder()
      };
      assert!(build_kinovi_seedance_2p5_preview(builder).is_err());
    }

    #[test]
    fn resolution_none_defaults_to_720p() {
      let builder = GenerateVideoRequestBuilder { resolution: None, ..preview_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(builder));
      assert!(matches!(draft.resolution, Some(KinoviOutputResolution::SevenTwentyP)));
    }
  }

  mod unhandled_request_state {
    use super::*;

    #[test]
    fn media_refs_placed_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        reference_images: Some(ImageListRef::Urls(vec!["https://example.com/ref.jpg".to_string()])),
        reference_videos: Some(VideoListRef::Urls(vec!["https://example.com/vid.mp4".to_string()])),
        reference_audio: Some(AudioListRef::Urls(vec!["https://example.com/audio.mp3".to_string()])),
        ..preview_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(remaining.reference_images.is_some());
      assert!(remaining.reference_videos.is_some());
      assert!(remaining.reference_audio.is_some());
    }

    #[test]
    fn empty_refs_are_none_in_unhandled() {
      let draft = unwrap_draft(build_kinovi_seedance_2p5_preview(preview_builder()));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(remaining.reference_images.is_none());
      assert!(remaining.reference_videos.is_none());
      assert!(remaining.reference_audio.is_none());
    }
  }

  // ── Helpers ──

  fn preview_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p5Preview,
      provider: RouterProvider::KinoviWeb,
      prompt: Some("a cat dancing".to_string()),
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn unwrap_draft(result: Result<VideoGenerationDraftOrRequest, ArtcraftRouterError>) -> KinoviSeedance2p5PreviewDraftState {
    match result.expect("build should succeed") {
      VideoGenerationDraftOrRequest::Draft(
        VideoGenerationDraftRequest::KinoviSeedance2p5Preview(draft)
      ) => draft,
      _ => panic!("expected KinoviSeedance2p5Preview draft"),
    }
  }
}
