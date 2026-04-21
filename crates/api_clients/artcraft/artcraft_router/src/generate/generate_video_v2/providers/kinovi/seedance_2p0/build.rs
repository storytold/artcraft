use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::draft::{KinoviSeedance2p0DraftState, KinoviSeedance2p0RemainingItems};
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::convert::{plan_aspect_ratio, plan_batch_count, plan_duration, plan_output_resolution};
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

#[cfg(test)]
mod tests {
  use seedance2pro_client::requests::generate_video::generate_video::{KinoviAspectRatio, KinoviBatchCount, KinoviOutputResolution};
  use tokens::tokens::characters::CharacterToken;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::audio_list_ref::AudioListRef;
  use crate::api::character_list_ref::CharacterListRef;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::api::video_list_ref::VideoListRef;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::video_generation_draft::VideoGenerationDraftRequest;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance2p0,
      provider: Provider::Seedance2Pro,
      prompt: Some("a cat dancing".to_string()),
      negative_prompt: None,
      start_frame: None,
      end_frame: None,
      reference_images: None,
      reference_videos: None,
      reference_audio: None,
      reference_character_tokens: None,
      resolution: None,
      aspect_ratio: None,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      generate_audio: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      idempotency_token: None,
    }
  }

  fn unwrap_draft(result: Result<VideoGenerationDraftOrRequest, ArtcraftRouterError>) -> KinoviSeedance2p0DraftState {
    let draft_or_request = result.expect("build should succeed");
    match draft_or_request {
      VideoGenerationDraftOrRequest::Draft(
        VideoGenerationDraftRequest::KinoviSeedance2p0(draft)
      ) => draft,
      _ => panic!("expected KinoviSeedance2p0 draft"),
    }
  }

  // ── Materialized field conversions ──

  #[test]
  fn prompt_is_passed_through() {
    let draft = unwrap_draft(build_kinovi_seedance_2p0(base_builder()));
    assert_eq!(draft.prompt, "a cat dancing");
  }

  #[test]
  fn prompt_defaults_to_empty() {
    let builder = GenerateVideoRequestBuilder { prompt: None, ..base_builder() };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert_eq!(draft.prompt, "");
  }

  #[test]
  fn duration_seconds_converted() {
    let builder = GenerateVideoRequestBuilder { duration_seconds: Some(10), ..base_builder() };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert_eq!(draft.duration_seconds, 10);
  }

  #[test]
  fn duration_defaults_to_5() {
    let builder = GenerateVideoRequestBuilder { duration_seconds: None, ..base_builder() };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert_eq!(draft.duration_seconds, 5);
  }

  #[test]
  fn duration_clamped_to_max() {
    let builder = GenerateVideoRequestBuilder {
      duration_seconds: Some(99),
      ..base_builder()
    };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert_eq!(draft.duration_seconds, 15);
  }

  #[test]
  fn batch_count_one() {
    let builder = GenerateVideoRequestBuilder { video_batch_count: Some(1), ..base_builder() };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert!(matches!(draft.batch_count, KinoviBatchCount::One));
  }

  #[test]
  fn batch_count_two() {
    let builder = GenerateVideoRequestBuilder { video_batch_count: Some(2), ..base_builder() };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert!(matches!(draft.batch_count, KinoviBatchCount::Two));
  }

  #[test]
  fn batch_count_four() {
    let builder = GenerateVideoRequestBuilder { video_batch_count: Some(4), ..base_builder() };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert!(matches!(draft.batch_count, KinoviBatchCount::Four));
  }

  // ── Aspect ratio conversions ──

  #[test]
  fn aspect_ratio_wide() {
    let builder = GenerateVideoRequestBuilder {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      ..base_builder()
    };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Landscape16x9));
  }

  #[test]
  fn aspect_ratio_tall() {
    let builder = GenerateVideoRequestBuilder {
      aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
      ..base_builder()
    };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Portrait9x16));
  }

  #[test]
  fn aspect_ratio_square() {
    let builder = GenerateVideoRequestBuilder {
      aspect_ratio: Some(CommonAspectRatio::Square),
      ..base_builder()
    };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Square1x1));
  }

  #[test]
  fn aspect_ratio_defaults_to_landscape() {
    let builder = GenerateVideoRequestBuilder { aspect_ratio: None, ..base_builder() };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert!(matches!(draft.aspect_ratio, KinoviAspectRatio::Landscape16x9));
  }

  // ── Resolution conversions ──

  #[test]
  fn resolution_480p() {
    let builder = GenerateVideoRequestBuilder {
      resolution: Some(CommonResolution::FourEightyP),
      ..base_builder()
    };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert!(matches!(draft.resolution, Some(KinoviOutputResolution::FourEightyP)));
  }

  #[test]
  fn resolution_720p() {
    let builder = GenerateVideoRequestBuilder {
      resolution: Some(CommonResolution::SevenTwentyP),
      ..base_builder()
    };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert!(matches!(draft.resolution, Some(KinoviOutputResolution::SevenTwentyP)));
  }

  #[test]
  fn resolution_1080p() {
    let builder = GenerateVideoRequestBuilder {
      resolution: Some(CommonResolution::TenEightyP),
      ..base_builder()
    };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert!(matches!(draft.resolution, Some(KinoviOutputResolution::TenEightyP)));
  }

  #[test]
  fn resolution_none() {
    let builder = GenerateVideoRequestBuilder { resolution: None, ..base_builder() };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert!(draft.resolution.is_none());
  }

  #[test]
  fn unsupported_resolution_error_out() {
    let builder = GenerateVideoRequestBuilder {
      resolution: Some(CommonResolution::FourK),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..base_builder()
    };
    assert!(build_kinovi_seedance_2p0(builder).is_err());
  }

  #[test]
  fn unsupported_resolution_rounds_up() {
    let builder = GenerateVideoRequestBuilder {
      resolution: Some(CommonResolution::FourK),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      ..base_builder()
    };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    assert!(matches!(draft.resolution, Some(KinoviOutputResolution::TenEightyP)));
  }

  // ── unhandled_request_state: media refs are placed there ──

  #[test]
  fn unhandled_state_is_present() {
    let draft = unwrap_draft(build_kinovi_seedance_2p0(base_builder()));
    assert!(draft.unhandled_request_state.is_some());
  }

  #[test]
  fn start_frame_placed_in_unhandled() {
    let builder = GenerateVideoRequestBuilder {
      start_frame: Some(ImageRef::Url("https://example.com/start.jpg".to_string())),
      ..base_builder()
    };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    let remaining = draft.unhandled_request_state.unwrap();
    assert!(matches!(remaining.start_frame, Some(ImageRef::Url(url)) if url == "https://example.com/start.jpg"));
  }

  #[test]
  fn end_frame_placed_in_unhandled() {
    let builder = GenerateVideoRequestBuilder {
      end_frame: Some(ImageRef::Url("https://example.com/end.jpg".to_string())),
      ..base_builder()
    };
    let draft = unwrap_draft(build_kinovi_seedance_2p0(builder));
    let remaining = draft.unhandled_request_state.unwrap();
    assert!(matches!(remaining.end_frame, Some(ImageRef::Url(url)) if url == "https://example.com/end.jpg"));
  }

  #[test]
  fn start_frame_media_token_placed_in_unhandled() {
    let builder = GenerateVideoRequestBuilder {
      start_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_test123".to_string()))),
      ..base_builder()
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
      ..base_builder()
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
      ..base_builder()
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
      ..base_builder()
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
      ..base_builder()
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
    let draft = unwrap_draft(build_kinovi_seedance_2p0(base_builder()));
    let remaining = draft.unhandled_request_state.unwrap();
    assert!(remaining.start_frame.is_none());
    assert!(remaining.end_frame.is_none());
    assert!(remaining.reference_images.is_none());
    assert!(remaining.reference_videos.is_none());
    assert!(remaining.reference_audio.is_none());
    assert!(remaining.reference_character_tokens.is_none());
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
      ..base_builder()
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
}
