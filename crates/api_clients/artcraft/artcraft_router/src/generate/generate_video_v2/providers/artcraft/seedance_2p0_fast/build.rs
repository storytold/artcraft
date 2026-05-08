use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::resolve::{
  resolve_audio_list_ref, resolve_character_list_ref, resolve_image_list_ref,
  resolve_image_ref, resolve_video_list_ref,
};
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_fast::request::ArtcraftSeedance2p0FastRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_seedance_2p0_fast(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_output_resolution(builder.resolution.take(), strategy)?;
  let batch_count = plan_batch_count(builder.video_batch_count.take(), strategy)?;
  let duration_seconds = plan_duration(builder.duration_seconds.take(), strategy)?;
  let prompt = builder.prompt.take();

  let start_frame = resolve_image_ref(builder.start_frame.take())?;
  let end_frame = resolve_image_ref(builder.end_frame.take())?;
  let reference_images = resolve_image_list_ref(builder.reference_images.take())?;
  let reference_videos = resolve_video_list_ref(builder.reference_videos.take())?;
  let reference_audio = resolve_audio_list_ref(builder.reference_audio.take())?;
  let reference_characters = resolve_character_list_ref(builder.reference_character_tokens.take());
  let idempotency_token = builder.get_or_generate_idempotency_token();

  let request = OmniGenVideoCostAndGenerateRequest {
    model: Some(CommonVideoModelEnum::Seedance2p0Fast),
    idempotency_token: Some(idempotency_token),
    prompt,
    start_frame_image_media_token: start_frame,
    end_frame_image_media_token: end_frame,
    reference_image_media_tokens: reference_images,
    reference_video_media_tokens: reference_videos,
    reference_audio_media_tokens: reference_audio,
    reference_character_tokens: reference_characters,
    resolution,
    aspect_ratio,
    duration_seconds: duration_seconds.map(|d| d as u16),
    video_batch_count: Some(batch_count),
    negative_prompt: None,
    generate_audio: None,
    quality: None,
  };

  let state = ArtcraftSeedance2p0FastRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftSeedance2p0Fast(state)))
}

// -- Plan helpers --

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<CommonAspectRatioEnum>, ArtcraftRouterError> {
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(None),

    // Direct mappings
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(Some(CommonAspectRatioEnum::WideSixteenByNine))
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(Some(CommonAspectRatioEnum::TallNineBySixteen))
    }
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Ok(Some(CommonAspectRatioEnum::Square))
    }
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(CommonAspectRatioEnum::WideFourByThree)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(CommonAspectRatioEnum::TallThreeByFour)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(CommonAspectRatioEnum::WideTwentyOneByNine)),

    // Mismatches
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

fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> CommonAspectRatioEnum {
  match aspect_ratio {
    CommonAspectRatio::WideFiveByFour => CommonAspectRatioEnum::WideFourByThree,
    CommonAspectRatio::WideThreeByTwo => CommonAspectRatioEnum::WideFourByThree,
    CommonAspectRatio::TallFourByFive => CommonAspectRatioEnum::TallThreeByFour,
    CommonAspectRatio::TallTwoByThree => CommonAspectRatioEnum::TallThreeByFour,
    CommonAspectRatio::TallNineByTwentyOne => CommonAspectRatioEnum::TallNineBySixteen,
    _ => CommonAspectRatioEnum::Square,
  }
}

// Seedance 2.0 Fast supports output resolutions: 480p and 720p only.
fn plan_output_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<CommonResolutionEnum>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),

    Some(CommonResolution::FourEightyP) => Ok(Some(CommonResolutionEnum::FourEightyP)),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(CommonResolutionEnum::SevenTwentyP)),

    // 1080p not supported for Fast
    Some(CommonResolution::TenEightyP) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", CommonResolution::TenEightyP),
        }))
      }
      _ => Ok(Some(CommonResolutionEnum::SevenTwentyP)),
    },

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(Some(match unsupported {
          CommonResolution::HalfK => CommonResolutionEnum::FourEightyP,
          _ => CommonResolutionEnum::SevenTwentyP,
        }))
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(match unsupported {
          CommonResolution::HalfK => CommonResolutionEnum::FourEightyP,
          _ => CommonResolutionEnum::SevenTwentyP,
        }))
      }
    },
  }
}

// Batch counts: 1, 2, 4.
fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<u16, ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 | 2 | 4 => Ok(count),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(4),
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(if count < 4 { 2 } else { 4 })
      }
    },
  }
}

// Duration: 4-15 seconds.
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
  use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
  use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
  use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;
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
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

  use super::*;

  // ── Field conversions ──

  mod field_conversions {
    use super::*;

    #[test]
    fn prompt_is_passed_through() {
      let req = unwrap_request(artcraft_fast_builder_with(|b| { b.prompt = Some("test".to_string()); }));
      assert_eq!(req.request.prompt, Some("test".to_string()));
    }

    #[test]
    fn prompt_none_stays_none() {
      let req = unwrap_request(artcraft_fast_builder_with(|_| {}));
      assert!(req.request.prompt.is_none());
    }

    #[test]
    fn model_is_seedance_2p0_fast() {
      let req = unwrap_request(artcraft_fast_builder_with(|_| {}));
      assert!(matches!(req.request.model, Some(CommonVideoModelEnum::Seedance2p0Fast)));
    }

    #[test]
    fn duration_passed_through() {
      let req = unwrap_request(artcraft_fast_builder_with(|b| { b.duration_seconds = Some(10); }));
      assert_eq!(req.request.duration_seconds, Some(10));
    }

    #[test]
    fn duration_clamped_to_max() {
      let req = unwrap_request(artcraft_fast_builder_with(|b| { b.duration_seconds = Some(99); }));
      assert_eq!(req.request.duration_seconds, Some(15));
    }

    #[test]
    fn batch_count_passed_through() {
      let req = unwrap_request(artcraft_fast_builder_with(|b| { b.video_batch_count = Some(4); }));
      assert_eq!(req.request.video_batch_count, Some(4));
    }
  }

  // ── Aspect ratio ──

  mod aspect_ratio_tests {
    use super::*;

    #[test]
    fn wide() {
      let req = unwrap_request(artcraft_fast_builder_with(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::WideSixteenByNine);
      }));
      assert_eq!(req.request.aspect_ratio, Some(CommonAspectRatioEnum::WideSixteenByNine));
    }

    #[test]
    fn tall() {
      let req = unwrap_request(artcraft_fast_builder_with(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::TallNineBySixteen);
      }));
      assert_eq!(req.request.aspect_ratio, Some(CommonAspectRatioEnum::TallNineBySixteen));
    }

    #[test]
    fn square() {
      let req = unwrap_request(artcraft_fast_builder_with(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::Square);
      }));
      assert_eq!(req.request.aspect_ratio, Some(CommonAspectRatioEnum::Square));
    }

    #[test]
    fn none_stays_none() {
      let req = unwrap_request(artcraft_fast_builder_with(|_| {}));
      assert!(req.request.aspect_ratio.is_none());
    }
  }

  // ── Resolution ──

  mod resolution_tests {
    use super::*;

    #[test]
    fn res_480p() {
      let req = unwrap_request(artcraft_fast_builder_with(|b| {
        b.resolution = Some(CommonResolution::FourEightyP);
      }));
      assert_eq!(req.request.resolution, Some(CommonResolutionEnum::FourEightyP));
    }

    #[test]
    fn res_720p() {
      let req = unwrap_request(artcraft_fast_builder_with(|b| {
        b.resolution = Some(CommonResolution::SevenTwentyP);
      }));
      assert_eq!(req.request.resolution, Some(CommonResolutionEnum::SevenTwentyP));
    }

    #[test]
    fn res_1080p_downgrades_to_720p() {
      let req = unwrap_request(artcraft_fast_builder_with(|b| {
        b.resolution = Some(CommonResolution::TenEightyP);
      }));
      assert_eq!(req.request.resolution, Some(CommonResolutionEnum::SevenTwentyP));
    }

    #[test]
    fn res_1080p_error_out() {
      let result = build_artcraft_seedance_2p0_fast(GenerateVideoRequestBuilder {
        model: CommonVideoModel::Seedance2p0Fast,
        provider: Provider::Artcraft,
        resolution: Some(CommonResolution::TenEightyP),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..Default::default()
      });
      assert!(result.is_err());
    }

    #[test]
    fn none_stays_none() {
      let req = unwrap_request(artcraft_fast_builder_with(|_| {}));
      assert!(req.request.resolution.is_none());
    }
  }

  // ── Media tokens ──

  mod media_token_tests {
    use super::*;

    #[test]
    fn start_frame_token_passed_through() {
      let token = MediaFileToken::new("mf_start".to_string());
      let req = unwrap_request(artcraft_fast_builder_with(|b| {
        b.start_frame = Some(ImageRef::MediaFileToken(token.clone()));
      }));
      assert_eq!(req.request.start_frame_image_media_token, Some(token));
    }

    #[test]
    fn url_start_frame_rejected() {
      let result = build_artcraft_seedance_2p0_fast(GenerateVideoRequestBuilder {
        model: CommonVideoModel::Seedance2p0Fast,
        provider: Provider::Artcraft,
        start_frame: Some(ImageRef::Url("https://example.com".to_string())),
        ..Default::default()
      });
      assert!(result.is_err());
    }

    #[test]
    fn reference_image_tokens_passed_through() {
      let tokens = vec![
        MediaFileToken::new("mf_a".to_string()),
        MediaFileToken::new("mf_b".to_string()),
      ];
      let req = unwrap_request(artcraft_fast_builder_with(|b| {
        b.reference_images = Some(ImageListRef::MediaFileTokens(tokens.clone()));
      }));
      assert_eq!(req.request.reference_image_media_tokens, Some(tokens));
    }

    #[test]
    fn character_tokens_passed_through() {
      let tokens = vec![
        CharacterToken::new("char_a".to_string()),
        CharacterToken::new("char_b".to_string()),
      ];
      let req = unwrap_request(artcraft_fast_builder_with(|b| {
        b.reference_character_tokens = Some(CharacterListRef::CharacterTokens(tokens.clone()));
      }));
      assert_eq!(req.request.reference_character_tokens, Some(tokens));
    }
  }

  // ── Helpers ──

  fn artcraft_fast_builder_with(f: impl FnOnce(&mut GenerateVideoRequestBuilder)) -> GenerateVideoRequestBuilder {
    let mut builder = GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance2p0Fast,
      provider: Provider::Artcraft,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    };
    f(&mut builder);
    builder
  }

  fn unwrap_request(builder: GenerateVideoRequestBuilder) -> ArtcraftSeedance2p0FastRequestState {
    let result = build_artcraft_seedance_2p0_fast(builder).expect("build should succeed");
    match result {
      VideoGenerationDraftOrRequest::Request(
        VideoGenerationRequest::ArtcraftSeedance2p0Fast(state)
      ) => state,
      _ => panic!("expected ArtcraftSeedance2p0Fast request"),
    }
  }
}
