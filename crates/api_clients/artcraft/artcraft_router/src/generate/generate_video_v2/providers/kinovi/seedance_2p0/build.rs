use seedance2pro_client::generate::video::generate_seedance_2p0::{
  KinoviSeedance2p0AspectRatio as KinoviAspectRatio,
  KinoviSeedance2p0BatchCount as KinoviBatchCount,
  KinoviSeedance2p0OutputResolution as KinoviOutputResolution,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::draft::{KinoviSeedance2p0DraftState, KinoviSeedance2p0RemainingItems};
use crate::generate::generate_video_v2::video_generation_draft::VideoGenerationDraftRequest;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

pub fn build_kinovi_seedance_2p0(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let draft = do_build_kinovi_seedance_2p0(builder)?;
  Ok(VideoGenerationDraftOrRequest::Draft(VideoGenerationDraftRequest::KinoviSeedance2p0(draft)))
}

fn do_build_kinovi_seedance_2p0(mut builder: GenerateVideoRequestBuilder) -> Result<KinoviSeedance2p0DraftState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_output_resolution(builder.resolution.take(), strategy)?;
  let batch_count = plan_batch_count(builder.video_batch_count.take(), strategy)?;
  let duration_seconds = plan_duration(builder.duration_seconds.take(), strategy)?;
  let prompt = builder.prompt.take().unwrap_or_default();

  let unhandled_request_state = KinoviSeedance2p0RemainingItems {
    start_frame: builder.start_frame.take(),
    end_frame: builder.end_frame.take(),
    reference_images: builder.reference_images.take(),
    reference_videos: builder.reference_videos.take(),
    reference_audio: builder.reference_audio.take(),
    reference_character_tokens: builder.reference_character_tokens.take(),
  };

  Ok(KinoviSeedance2p0DraftState {
    aspect_ratio,
    resolution,
    batch_count,
    duration_seconds,
    prompt,
    unhandled_request_state: Some(unhandled_request_state),
  })
}

// ── Plan helpers ──

// Supported aspect ratios and their AR values (width / height):
//   Portrait9x16 = 0.5625, Portrait3x4 = 0.75, Square1x1 = 1.0, Standard4x3 = 1.33, Landscape16x9 = 1.78
//
// All supported ratios cost the same, so PayMoreUpgrade and PayLessDowngrade both
// select the nearest match rather than rounding in a specific direction.
fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<KinoviAspectRatio, ArtcraftRouterError> {
  match aspect_ratio {
    // No preference or auto — default to landscape
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(KinoviAspectRatio::Landscape16x9),

    // Direct mappings
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(KinoviAspectRatio::Landscape16x9)
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(KinoviAspectRatio::Portrait9x16)
    }
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Ok(KinoviAspectRatio::Square1x1)
    }
    Some(CommonAspectRatio::WideFourByThree) => Ok(KinoviAspectRatio::Standard4x3),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(KinoviAspectRatio::Portrait3x4),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(KinoviAspectRatio::UltraWide21x9),

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
fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> KinoviAspectRatio {
  match aspect_ratio {
    CommonAspectRatio::WideFiveByFour => KinoviAspectRatio::Standard4x3,         // 1.25, nearest 1.33
    CommonAspectRatio::WideThreeByTwo => KinoviAspectRatio::Standard4x3,         // 1.50, nearest 1.33
    CommonAspectRatio::TallFourByFive => KinoviAspectRatio::Portrait3x4,         // 0.80, nearest 0.75
    CommonAspectRatio::TallTwoByThree => KinoviAspectRatio::Portrait3x4,         // 0.67, nearest 0.75
    CommonAspectRatio::TallNineByTwentyOne => KinoviAspectRatio::Portrait9x16,   // 0.43, nearest 0.56
    _ => KinoviAspectRatio::Square1x1,
  }
}

// Seedance 2.0 Pro supports output resolutions: 480p, 720p, 1080p.
fn plan_output_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<KinoviOutputResolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),

    // Direct mappings
    Some(CommonResolution::FourEightyP) => Ok(Some(KinoviOutputResolution::FourEightyP)),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(KinoviOutputResolution::SevenTwentyP)),
    Some(CommonResolution::TenEightyP) => Ok(Some(KinoviOutputResolution::TenEightyP)),

    // Mismatches
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(Some(match unsupported {
          CommonResolution::HalfK => KinoviOutputResolution::FourEightyP,
          _ => KinoviOutputResolution::TenEightyP,
        }))
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(match unsupported {
          CommonResolution::HalfK => KinoviOutputResolution::FourEightyP,
          _ => KinoviOutputResolution::TenEightyP,
        }))
      }
    },
  }
}

// Seedance2p0 supports batch counts of 1, 2, and 4 only.
fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<KinoviBatchCount, ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(KinoviBatchCount::One),
    2 => Ok(KinoviBatchCount::Two),
    4 => Ok(KinoviBatchCount::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(if count < 4 { KinoviBatchCount::Four } else { KinoviBatchCount::Four })
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(if count < 4 { KinoviBatchCount::Two } else { KinoviBatchCount::Four })
      }
    },
  }
}

// Seedance2p0 supports duration of 4–15 seconds.
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

#[cfg(test)]
mod tests {
  use seedance2pro_client::generate::video::generate_seedance_2p0::{
    KinoviSeedance2p0AspectRatio as KinoviAspectRatio,
    KinoviSeedance2p0BatchCount as KinoviBatchCount,
    KinoviSeedance2p0OutputResolution as KinoviOutputResolution,
  };
  use tokens::tokens::characters::CharacterToken;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::audio_list_ref::AudioListRef;
  use crate::api::character_list_ref::CharacterListRef;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::api::video_list_ref::VideoListRef;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::video_generation_draft::VideoGenerationDraftRequest;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

  use super::*;

  // ── Materialized field conversions ──

  mod materialized_field_conversions {
    use super::*;

    #[test]
    fn prompt_is_passed_through() {
      let draft = unwrap_draft(build_kinovi_seedance_2p0(seedance2pro_builder()));
      assert_eq!(draft.prompt, "a cat dancing");
    }

    #[test]
    fn prompt_defaults_to_empty() {
      let builder = GenerateVideoRequestBuilder { prompt: None, ..seedance2pro_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert_eq!(draft.prompt, "");
    }

    #[test]
    fn duration_seconds_converted() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: Some(10), ..seedance2pro_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert_eq!(draft.duration_seconds, 10);
    }

    #[test]
    fn duration_defaults_to_5() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: None, ..seedance2pro_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert_eq!(draft.duration_seconds, 5);
    }

    #[test]
    fn duration_clamped_to_max() {
      let builder = GenerateVideoRequestBuilder {
        duration_seconds: Some(99),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert_eq!(draft.duration_seconds, 15);
    }

    #[test]
    fn batch_count_one() {
      let builder = GenerateVideoRequestBuilder { video_batch_count: Some(1), ..seedance2pro_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert!(matches!(draft.batch_count, KinoviBatchCount::One));
    }

    #[test]
    fn batch_count_two() {
      let builder = GenerateVideoRequestBuilder { video_batch_count: Some(2), ..seedance2pro_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert!(matches!(draft.batch_count, KinoviBatchCount::Two));
    }

    #[test]
    fn batch_count_four() {
      let builder = GenerateVideoRequestBuilder { video_batch_count: Some(4), ..seedance2pro_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert!(matches!(draft.batch_count, KinoviBatchCount::Four));
    }
  }

  // ── Aspect ratio conversions ──

  mod aspect_ratio_conversions {
    use super::*;

    #[test]
    fn aspect_ratio_wide() {
      let builder = GenerateVideoRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Landscape16x9));
    }

    #[test]
    fn aspect_ratio_tall() {
      let builder = GenerateVideoRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Portrait9x16));
    }

    #[test]
    fn aspect_ratio_square() {
      let builder = GenerateVideoRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::Square),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Square1x1));
    }

    #[test]
    fn aspect_ratio_defaults_to_landscape() {
      let builder = GenerateVideoRequestBuilder { aspect_ratio: None, ..seedance2pro_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Landscape16x9));
    }
  }

  // ── Resolution conversions ──

  mod resolution_conversions {
    use super::*;

    #[test]
    fn resolution_480p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::FourEightyP),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert!(matches!(draft.resolution, Some(KinoviOutputResolution::FourEightyP)));
    }

    #[test]
    fn resolution_720p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::SevenTwentyP),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert!(matches!(draft.resolution, Some(KinoviOutputResolution::SevenTwentyP)));
    }

    #[test]
    fn resolution_1080p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::TenEightyP),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert!(matches!(draft.resolution, Some(KinoviOutputResolution::TenEightyP)));
    }

    #[test]
    fn resolution_none() {
      let builder = GenerateVideoRequestBuilder { resolution: None, ..seedance2pro_builder() };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert!(draft.resolution.is_none());
    }

    #[test]
    fn unsupported_resolution_error_out() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::FourK),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..seedance2pro_builder()
      };
      assert!(build_kinovi_seedance_2p0(builder).is_err());
    }

    #[test]
    fn unsupported_resolution_rounds_up() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::FourK),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      assert!(matches!(draft.resolution, Some(KinoviOutputResolution::TenEightyP)));
    }
  }

  // ── unhandled_request_state: media refs are placed there ──

  mod unhandled_request_state {
    use super::*;

    #[test]
    fn unhandled_state_is_present() {
      let draft = unwrap_draft(build_kinovi_seedance_2p0(seedance2pro_builder()));
      assert!(draft.unhandled_request_state.is_some());
    }

    #[test]
    fn start_frame_placed_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::Url("https://example.com/start.jpg".to_string())),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(matches!(remaining.start_frame, Some(ImageRef::Url(url)) if url == "https://example.com/start.jpg"));
    }

    #[test]
    fn end_frame_placed_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        end_frame: Some(ImageRef::Url("https://example.com/end.jpg".to_string())),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(matches!(remaining.end_frame, Some(ImageRef::Url(url)) if url == "https://example.com/end.jpg"));
    }

    #[test]
    fn start_frame_media_token_placed_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_test123".to_string()))),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(matches!(remaining.start_frame, Some(ImageRef::MediaFileToken(t)) if t.as_str() == "mf_test123"));
    }

    #[test]
    fn reference_images_placed_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        reference_images: Some(ImageListRef::Urls(vec![
          "https://example.com/ref1.jpg".to_string(),
          "https://example.com/ref2.jpg".to_string(),
        ])),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      match remaining.reference_images {
        Some(ImageListRef::Urls(urls)) => {
          assert_eq!(urls.len(), 2);
          assert_eq!(urls[0], "https://example.com/ref1.jpg");
          assert_eq!(urls[1], "https://example.com/ref2.jpg");
        }
        _ => panic!("expected Urls variant"),
      }
    }

    #[test]
    fn reference_videos_placed_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        reference_videos: Some(VideoListRef::Urls(vec![
          "https://example.com/vid.mp4".to_string(),
        ])),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(matches!(remaining.reference_videos, Some(VideoListRef::Urls(urls)) if urls.len() == 1));
    }

    #[test]
    fn reference_audio_placed_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        reference_audio: Some(AudioListRef::Urls(vec![
          "https://example.com/audio.mp3".to_string(),
        ])),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(matches!(remaining.reference_audio, Some(AudioListRef::Urls(urls)) if urls.len() == 1));
    }

    #[test]
    fn character_tokens_placed_in_unhandled() {
      let builder = GenerateVideoRequestBuilder {
        reference_character_tokens: Some(CharacterListRef::CharacterTokens(vec![
          CharacterToken::new("char_abc".to_string()),
          CharacterToken::new("char_def".to_string()),
        ])),
        ..seedance2pro_builder()
      };
      let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
      let remaining = draft.unhandled_request_state.unwrap();
      match remaining.reference_character_tokens {
        Some(CharacterListRef::CharacterTokens(tokens)) => {
          assert_eq!(tokens.len(), 2);
          assert_eq!(tokens[0].as_str(), "char_abc");
          assert_eq!(tokens[1].as_str(), "char_def");
        }
        _ => panic!("expected CharacterTokens variant"),
      }
    }

    #[test]
    fn empty_refs_are_none_in_unhandled() {
      let draft = unwrap_draft(build_kinovi_seedance_2p0(seedance2pro_builder()));
      let remaining = draft.unhandled_request_state.unwrap();
      assert!(remaining.start_frame.is_none());
      assert!(remaining.end_frame.is_none());
      assert!(remaining.reference_images.is_none());
      assert!(remaining.reference_videos.is_none());
      assert!(remaining.reference_audio.is_none());
      assert!(remaining.reference_character_tokens.is_none());
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
      end_frame: Some(ImageRef::Url("https://example.com/end.jpg".to_string())),
      reference_images: Some(ImageListRef::Urls(vec!["https://example.com/ref.jpg".to_string()])),
      reference_videos: Some(VideoListRef::Urls(vec!["https://example.com/vid.mp4".to_string()])),
      reference_audio: Some(AudioListRef::Urls(vec!["https://example.com/audio.mp3".to_string()])),
      reference_character_tokens: Some(CharacterListRef::CharacterTokens(vec![
        CharacterToken::new("char_xyz".to_string()),
      ])),
      ..seedance2pro_builder()
    };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));

    assert_eq!(draft.prompt, "full test");
    assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Portrait9x16));
    assert!(matches!(draft.resolution, Some(KinoviOutputResolution::TenEightyP)));
    assert_eq!(draft.duration_seconds, 10);
    assert!(matches!(draft.batch_count, KinoviBatchCount::Four));

    let remaining = draft.unhandled_request_state.unwrap();
    assert!(remaining.start_frame.is_some());
    assert!(remaining.end_frame.is_some());
    assert!(remaining.reference_images.is_some());
    assert!(remaining.reference_videos.is_some());
    assert!(remaining.reference_audio.is_some());
    assert!(remaining.reference_character_tokens.is_some());
  }

  // ── Helpers ──

  fn seedance2pro_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      provider: Provider::Seedance2Pro,
      prompt: Some("a cat dancing".to_string()),
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn unwrap_draft(result: Result<VideoGenerationDraftOrRequest, ArtcraftRouterError>) -> KinoviSeedance2p0DraftState {
    match result.expect("build should succeed") {
      VideoGenerationDraftOrRequest::Draft(
        VideoGenerationDraftRequest::KinoviSeedance2p0(draft)
      ) => draft,
      _ => panic!("expected KinoviSeedance2p0 draft"),
    }
  }
}
