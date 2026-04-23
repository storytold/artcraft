use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
  Seedance2p0AspectRatio, Seedance2p0BatchCount, Seedance2p0MultiFunctionVideoGenRequest,
  Seedance2p0OutputResolution,
};

use crate::api::audio_list_ref::AudioListRef;
use crate::api::character_list_ref::CharacterListRef;
use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_fast::request::ArtcraftSeedance2p0FastRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_seedance_2p0_fast(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let output_resolution = plan_output_resolution(builder.resolution.take(), strategy)?;
  let batch_count = plan_batch_count(builder.video_batch_count.take(), strategy)?;
  let duration_seconds = plan_duration(builder.duration_seconds.take(), strategy)?;
  let prompt = builder.prompt.take();

  let start_frame_media_token = resolve_image_ref(builder.start_frame.take())?;
  let end_frame_media_token = resolve_image_ref(builder.end_frame.take())?;
  let reference_image_media_tokens = resolve_image_list_ref(builder.reference_images.take())?;
  let reference_video_media_tokens = resolve_video_list_ref(builder.reference_videos.take())?;
  let reference_audio_media_tokens = resolve_audio_list_ref(builder.reference_audio.take())?;
  let reference_character_tokens = resolve_character_list_ref(builder.reference_character_tokens.take());
  let idempotency_token = builder.get_or_generate_idempotency_token();

  let request = Seedance2p0MultiFunctionVideoGenRequest {
    uuid_idempotency_token: idempotency_token,
    prompt,
    start_frame_media_token,
    end_frame_media_token,
    reference_image_media_tokens,
    reference_video_media_tokens,
    reference_audio_media_tokens,
    reference_character_tokens,
    aspect_ratio,
    output_resolution,
    duration_seconds,
    batch_count: Some(batch_count),
  };

  let state = ArtcraftSeedance2p0FastRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftSeedance2p0Fast(state)))
}

// -- Resolve helpers --

fn resolve_image_ref(
  image_ref: Option<ImageRef>,
) -> Result<Option<tokens::tokens::media_files::MediaFileToken>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::MediaFileToken(t)) => Ok(Some(t)),
    Some(ImageRef::Url(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

fn resolve_image_list_ref(
  image_list_ref: Option<ImageListRef>,
) -> Result<Option<Vec<tokens::tokens::media_files::MediaFileToken>>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(None),
    Some(ImageListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(ImageListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

fn resolve_video_list_ref(
  video_list_ref: Option<VideoListRef>,
) -> Result<Option<Vec<tokens::tokens::media_files::MediaFileToken>>, ArtcraftRouterError> {
  match video_list_ref {
    None => Ok(None),
    Some(VideoListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(VideoListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

fn resolve_audio_list_ref(
  audio_list_ref: Option<AudioListRef>,
) -> Result<Option<Vec<tokens::tokens::media_files::MediaFileToken>>, ArtcraftRouterError> {
  match audio_list_ref {
    None => Ok(None),
    Some(AudioListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(AudioListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

fn resolve_character_list_ref(
  character_list_ref: Option<CharacterListRef>,
) -> Option<Vec<tokens::tokens::characters::CharacterToken>> {
  match character_list_ref {
    None => None,
    Some(CharacterListRef::CharacterTokens(tokens)) => Some(tokens),
  }
}

// -- Plan helpers --

// Supported aspect ratios and their AR values (width / height):
//   Portrait9x16 = 0.5625, Portrait3x4 = 0.75, Square1x1 = 1.0, Standard4x3 = 1.33, Landscape16x9 = 1.78
//
// All supported ratios cost the same, so PayMoreUpgrade and PayLessDowngrade both
// select the nearest match rather than rounding in a specific direction.
fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance2p0AspectRatio>, ArtcraftRouterError> {
  match aspect_ratio {
    // No preference or auto — let the model decide
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(None),

    // Direct mappings
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(Some(Seedance2p0AspectRatio::Landscape16x9))
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(Some(Seedance2p0AspectRatio::Portrait9x16))
    }
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Ok(Some(Seedance2p0AspectRatio::Square1x1))
    }
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(Seedance2p0AspectRatio::Standard4x3)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(Seedance2p0AspectRatio::Portrait3x4)),

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
        Ok(Some(nearest_aspect_ratio(unsupported)))
      }
    },
  }
}

/// Pick the nearest supported aspect ratio by AR value (width / height).
fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> Seedance2p0AspectRatio {
  match aspect_ratio {
    CommonAspectRatio::WideFiveByFour => Seedance2p0AspectRatio::Standard4x3,         // 1.25, nearest 1.33
    CommonAspectRatio::WideThreeByTwo => Seedance2p0AspectRatio::Standard4x3,         // 1.50, nearest 1.33
    CommonAspectRatio::WideTwentyOneByNine => Seedance2p0AspectRatio::Landscape16x9,  // 2.33, nearest 1.78
    CommonAspectRatio::TallFourByFive => Seedance2p0AspectRatio::Portrait3x4,         // 0.80, nearest 0.75
    CommonAspectRatio::TallTwoByThree => Seedance2p0AspectRatio::Portrait3x4,         // 0.67, nearest 0.75
    CommonAspectRatio::TallNineByTwentyOne => Seedance2p0AspectRatio::Portrait9x16,   // 0.43, nearest 0.56
    _ => Seedance2p0AspectRatio::Square1x1,
  }
}

// Seedance 2.0 Fast supports output resolutions: 480p and 720p only.
// 1080p is NOT supported — downgrade to 720p or error based on strategy.
fn plan_output_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance2p0OutputResolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),

    // Direct mappings
    Some(CommonResolution::FourEightyP) => Ok(Some(Seedance2p0OutputResolution::FourEightyP)),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(Seedance2p0OutputResolution::SevenTwentyP)),

    // 1080p is not supported for Fast — handle via strategy
    Some(CommonResolution::TenEightyP) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", CommonResolution::TenEightyP),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        // 1080p not available — downgrade to 720p (highest supported)
        Ok(Some(Seedance2p0OutputResolution::SevenTwentyP))
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
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(Some(match unsupported {
          CommonResolution::HalfK => Seedance2p0OutputResolution::FourEightyP,
          _ => Seedance2p0OutputResolution::SevenTwentyP,
        }))
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(match unsupported {
          CommonResolution::HalfK => Seedance2p0OutputResolution::FourEightyP,
          _ => Seedance2p0OutputResolution::SevenTwentyP,
        }))
      }
    },
  }
}

// Seedance2p0Fast supports batch counts of 1, 2, and 4 only.
fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Seedance2p0BatchCount, ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(Seedance2p0BatchCount::One),
    2 => Ok(Seedance2p0BatchCount::Two),
    4 => Ok(Seedance2p0BatchCount::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(if count < 4 { Seedance2p0BatchCount::Four } else { Seedance2p0BatchCount::Four })
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(if count < 4 { Seedance2p0BatchCount::Two } else { Seedance2p0BatchCount::Four })
      }
    },
  }
}

// Seedance2p0Fast supports duration of 4-15 seconds.
fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u8>, ArtcraftRouterError> {
  const MIN: u16 = 4;
  const MAX: u16 = 15;
  match duration_seconds {
    None => Ok(None),
    Some(d) if d >= MIN && d <= MAX => Ok(Some(d as u8)),
    Some(d) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(Some(d.clamp(MIN, MAX) as u8)),
    },
  }
}

#[cfg(test)]
mod tests {
  use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
    Seedance2p0AspectRatio, Seedance2p0BatchCount, Seedance2p0OutputResolution,
  };
  use tokens::tokens::characters::CharacterToken;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::character_list_ref::CharacterListRef;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::api::video_list_ref::VideoListRef;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::errors::artcraft_router_error::ArtcraftRouterError;
  use crate::errors::client_error::ClientError;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_fast::request::ArtcraftSeedance2p0FastRequestState;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

  use super::*;

  // -- Materialized field conversions --

  mod materialized_field_conversions {
    use super::*;

    #[test]
    fn prompt_is_passed_through() {
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(artcraft_fast_builder()));
      assert_eq!(state.request.prompt.as_deref(), Some("a cat dancing"));
    }

    #[test]
    fn prompt_defaults_to_none() {
      let builder = GenerateVideoRequestBuilder { prompt: None, ..artcraft_fast_builder() };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(state.request.prompt.is_none());
    }

    #[test]
    fn duration_seconds_converted() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: Some(10), ..artcraft_fast_builder() };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert_eq!(state.request.duration_seconds, Some(10));
    }

    #[test]
    fn duration_defaults_to_none() {
      let builder = GenerateVideoRequestBuilder { duration_seconds: None, ..artcraft_fast_builder() };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(state.request.duration_seconds.is_none());
    }

    #[test]
    fn duration_clamped_to_max() {
      let builder = GenerateVideoRequestBuilder {
        duration_seconds: Some(99),
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert_eq!(state.request.duration_seconds, Some(15));
    }

    #[test]
    fn batch_count_one() {
      let builder = GenerateVideoRequestBuilder { video_batch_count: Some(1), ..artcraft_fast_builder() };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(matches!(state.request.batch_count, Some(Seedance2p0BatchCount::One)));
    }

    #[test]
    fn batch_count_two() {
      let builder = GenerateVideoRequestBuilder { video_batch_count: Some(2), ..artcraft_fast_builder() };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(matches!(state.request.batch_count, Some(Seedance2p0BatchCount::Two)));
    }

    #[test]
    fn batch_count_four() {
      let builder = GenerateVideoRequestBuilder { video_batch_count: Some(4), ..artcraft_fast_builder() };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(matches!(state.request.batch_count, Some(Seedance2p0BatchCount::Four)));
    }
  }

  // -- Aspect ratio conversions --

  mod aspect_ratio_conversions {
    use super::*;

    #[test]
    fn aspect_ratio_wide() {
      let builder = GenerateVideoRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(matches!(state.request.aspect_ratio, Some(Seedance2p0AspectRatio::Landscape16x9)));
    }

    #[test]
    fn aspect_ratio_tall() {
      let builder = GenerateVideoRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(matches!(state.request.aspect_ratio, Some(Seedance2p0AspectRatio::Portrait9x16)));
    }

    #[test]
    fn aspect_ratio_square() {
      let builder = GenerateVideoRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::Square),
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(matches!(state.request.aspect_ratio, Some(Seedance2p0AspectRatio::Square1x1)));
    }

    #[test]
    fn aspect_ratio_defaults_to_none() {
      let builder = GenerateVideoRequestBuilder { aspect_ratio: None, ..artcraft_fast_builder() };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(state.request.aspect_ratio.is_none());
    }
  }

  // -- Resolution conversions --

  mod resolution_conversions {
    use super::*;

    #[test]
    fn resolution_480p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::FourEightyP),
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(matches!(state.request.output_resolution, Some(Seedance2p0OutputResolution::FourEightyP)));
    }

    #[test]
    fn resolution_720p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::SevenTwentyP),
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(matches!(state.request.output_resolution, Some(Seedance2p0OutputResolution::SevenTwentyP)));
    }

    #[test]
    fn resolution_1080p_downgrades_to_720p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::TenEightyP),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(matches!(state.request.output_resolution, Some(Seedance2p0OutputResolution::SevenTwentyP)));
    }

    #[test]
    fn resolution_1080p_upgrade_also_downgrades_to_720p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::TenEightyP),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(matches!(state.request.output_resolution, Some(Seedance2p0OutputResolution::SevenTwentyP)));
    }

    #[test]
    fn resolution_1080p_error_out() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::TenEightyP),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..artcraft_fast_builder()
      };
      assert!(build_artcraft_seedance_2p0_fast(builder).is_err());
    }

    #[test]
    fn resolution_none() {
      let builder = GenerateVideoRequestBuilder { resolution: None, ..artcraft_fast_builder() };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(state.request.output_resolution.is_none());
    }

    #[test]
    fn unsupported_resolution_error_out() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::FourK),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..artcraft_fast_builder()
      };
      assert!(build_artcraft_seedance_2p0_fast(builder).is_err());
    }

    #[test]
    fn unsupported_resolution_rounds_to_720p() {
      let builder = GenerateVideoRequestBuilder {
        resolution: Some(CommonResolution::FourK),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert!(matches!(state.request.output_resolution, Some(Seedance2p0OutputResolution::SevenTwentyP)));
    }
  }

  // -- Media token resolution --

  mod media_token_resolution {
    use super::*;

    #[test]
    fn start_frame_media_token() {
      let builder = GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_start123".to_string()))),
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert_eq!(state.request.start_frame_media_token.as_ref().unwrap().as_str(), "mf_start123");
    }

    #[test]
    fn end_frame_media_token() {
      let builder = GenerateVideoRequestBuilder {
        end_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_end456".to_string()))),
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      assert_eq!(state.request.end_frame_media_token.as_ref().unwrap().as_str(), "mf_end456");
    }

    #[test]
    fn reference_image_media_tokens() {
      let builder = GenerateVideoRequestBuilder {
        reference_images: Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_ref1".to_string()),
          MediaFileToken::new("mf_ref2".to_string()),
        ])),
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      let tokens = state.request.reference_image_media_tokens.unwrap();
      assert_eq!(tokens.len(), 2);
      assert_eq!(tokens[0].as_str(), "mf_ref1");
      assert_eq!(tokens[1].as_str(), "mf_ref2");
    }

    #[test]
    fn reference_video_media_tokens() {
      let builder = GenerateVideoRequestBuilder {
        reference_videos: Some(VideoListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_vid1".to_string()),
        ])),
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      let tokens = state.request.reference_video_media_tokens.unwrap();
      assert_eq!(tokens.len(), 1);
      assert_eq!(tokens[0].as_str(), "mf_vid1");
    }

    #[test]
    fn character_tokens() {
      let builder = GenerateVideoRequestBuilder {
        reference_character_tokens: Some(CharacterListRef::CharacterTokens(vec![
          CharacterToken::new("char_abc".to_string()),
          CharacterToken::new("char_def".to_string()),
        ])),
        ..artcraft_fast_builder()
      };
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));
      let tokens = state.request.reference_character_tokens.unwrap();
      assert_eq!(tokens.len(), 2);
      assert_eq!(tokens[0].as_str(), "char_abc");
      assert_eq!(tokens[1].as_str(), "char_def");
    }

    #[test]
    fn url_image_ref_returns_error() {
      let builder = GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::Url("https://example.com/image.jpg".to_string())),
        ..artcraft_fast_builder()
      };
      assert!(matches!(
        build_artcraft_seedance_2p0_fast(builder),
        Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
      ));
    }

    #[test]
    fn empty_refs_are_none() {
      let state = unwrap_request(build_artcraft_seedance_2p0_fast(artcraft_fast_builder()));
      assert!(state.request.start_frame_media_token.is_none());
      assert!(state.request.end_frame_media_token.is_none());
      assert!(state.request.reference_image_media_tokens.is_none());
      assert!(state.request.reference_video_media_tokens.is_none());
      assert!(state.request.reference_audio_media_tokens.is_none());
      assert!(state.request.reference_character_tokens.is_none());
    }
  }

  // -- Returns Request, not Draft --

  #[test]
  fn build_returns_request_variant() {
    let result = build_artcraft_seedance_2p0_fast(artcraft_fast_builder()).expect("build should succeed");
    assert!(matches!(result, VideoGenerationDraftOrRequest::Request(_)));
  }

  // -- Full combination --

  #[test]
  fn full_request_all_fields() {
    let builder = GenerateVideoRequestBuilder {
      prompt: Some("full test".to_string()),
      aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
      resolution: Some(CommonResolution::SevenTwentyP),
      duration_seconds: Some(10),
      video_batch_count: Some(4),
      start_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_start".to_string()))),
      end_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_end".to_string()))),
      reference_images: Some(ImageListRef::MediaFileTokens(vec![MediaFileToken::new("mf_img".to_string())])),
      reference_videos: Some(VideoListRef::MediaFileTokens(vec![MediaFileToken::new("mf_vid".to_string())])),
      reference_character_tokens: Some(CharacterListRef::CharacterTokens(vec![
        CharacterToken::new("char_xyz".to_string()),
      ])),
      ..artcraft_fast_builder()
    };
    let state = unwrap_request(build_artcraft_seedance_2p0_fast(builder));

    assert_eq!(state.request.prompt.as_deref(), Some("full test"));
    assert!(matches!(state.request.aspect_ratio, Some(Seedance2p0AspectRatio::Portrait9x16)));
    assert!(matches!(state.request.output_resolution, Some(Seedance2p0OutputResolution::SevenTwentyP)));
    assert_eq!(state.request.duration_seconds, Some(10));
    assert!(matches!(state.request.batch_count, Some(Seedance2p0BatchCount::Four)));
    assert!(state.request.start_frame_media_token.is_some());
    assert!(state.request.end_frame_media_token.is_some());
    assert!(state.request.reference_image_media_tokens.is_some());
    assert!(state.request.reference_video_media_tokens.is_some());
    assert!(state.request.reference_character_tokens.is_some());
  }

  // -- Helpers --

  fn artcraft_fast_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance2p0Fast,
      provider: Provider::Artcraft,
      prompt: Some("a cat dancing".to_string()),
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn unwrap_request(result: Result<VideoGenerationDraftOrRequest, ArtcraftRouterError>) -> ArtcraftSeedance2p0FastRequestState {
    match result.expect("build should succeed") {
      VideoGenerationDraftOrRequest::Request(
        VideoGenerationRequest::ArtcraftSeedance2p0Fast(state)
      ) => state,
      _ => panic!("expected ArtcraftSeedance2p0Fast request"),
    }
  }
}
