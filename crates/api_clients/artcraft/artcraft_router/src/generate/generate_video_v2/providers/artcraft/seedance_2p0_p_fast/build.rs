use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_p_fast::request::ArtcraftSeedance2p0PlusFastRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_seedance_2p0_p_fast(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let request = build_artcraft_omni_request(
    builder,
    CommonVideoModelEnum::Seedance2p0PlusFast,
    SupportedResolutions::Fast,
    UltraWideSupport::Supported,
  )?;
  let state = ArtcraftSeedance2p0PlusFastRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftSeedance2p0PlusFast(state)))
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
  use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;
  use tokens::tokens::characters::CharacterToken;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::character_list_ref::CharacterListRef;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

  use super::*;

  mod field_conversions {
    use super::*;

    #[test]
    fn model_is_seedance_2p0_plus_fast() {
      let req = unwrap_request(make_builder(|_| {}));
      assert!(matches!(req.request.model, Some(CommonVideoModelEnum::Seedance2p0PlusFast)));
    }

    #[test]
    fn prompt_passed_through() {
      let req = unwrap_request(make_builder(|b| { b.prompt = Some("test".to_string()); }));
      assert_eq!(req.request.prompt, Some("test".to_string()));
    }

    #[test]
    fn duration_passed_through() {
      let req = unwrap_request(make_builder(|b| { b.duration_seconds = Some(10); }));
      assert_eq!(req.request.duration_seconds, Some(10));
    }

    #[test]
    fn duration_clamped_to_max() {
      let req = unwrap_request(make_builder(|b| { b.duration_seconds = Some(99); }));
      assert_eq!(req.request.duration_seconds, Some(15));
    }

    #[test]
    fn batch_count_passed_through() {
      let req = unwrap_request(make_builder(|b| { b.video_batch_count = Some(4); }));
      assert_eq!(req.request.video_batch_count, Some(4));
    }
  }

  mod resolution_tests {
    use super::*;

    #[test]
    fn res_480p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(CommonResolution::FourEightyP); }));
      assert_eq!(req.request.resolution, Some(CommonResolutionEnum::FourEightyP));
    }

    #[test]
    fn res_720p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(CommonResolution::SevenTwentyP); }));
      assert_eq!(req.request.resolution, Some(CommonResolutionEnum::SevenTwentyP));
    }

    #[test]
    fn res_1080p_downgrades_to_720p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(CommonResolution::TenEightyP); }));
      assert_eq!(req.request.resolution, Some(CommonResolutionEnum::SevenTwentyP));
    }

    #[test]
    fn res_1080p_error_out() {
      let result = build_artcraft_seedance_2p0_p_fast(GenerateVideoRequestBuilder {
        model: CommonVideoModel::Seedance2p0PlusFast,
        provider: Provider::Artcraft,
        resolution: Some(CommonResolution::TenEightyP),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..Default::default()
      });
      assert!(result.is_err());
    }

    #[test]
    fn none_stays_none() {
      let req = unwrap_request(make_builder(|_| {}));
      assert!(req.request.resolution.is_none());
    }
  }

  mod media_token_tests {
    use super::*;

    #[test]
    fn start_frame_token_passed_through() {
      let token = MediaFileToken::new("mf_start".to_string());
      let req = unwrap_request(make_builder(|b| {
        b.start_frame = Some(ImageRef::MediaFileToken(token.clone()));
      }));
      assert_eq!(req.request.start_frame_image_media_token, Some(token));
    }

    #[test]
    fn url_start_frame_rejected() {
      let result = build_artcraft_seedance_2p0_p_fast(GenerateVideoRequestBuilder {
        model: CommonVideoModel::Seedance2p0PlusFast,
        provider: Provider::Artcraft,
        start_frame: Some(ImageRef::Url("https://example.com".to_string())),
        ..Default::default()
      });
      assert!(result.is_err());
    }

    #[test]
    fn reference_image_tokens_passed_through() {
      let tokens = vec![MediaFileToken::new("mf_a".to_string()), MediaFileToken::new("mf_b".to_string())];
      let req = unwrap_request(make_builder(|b| {
        b.reference_images = Some(ImageListRef::MediaFileTokens(tokens.clone()));
      }));
      assert_eq!(req.request.reference_image_media_tokens, Some(tokens));
    }

    #[test]
    fn character_tokens_passed_through() {
      let tokens = vec![CharacterToken::new("char_a".to_string()), CharacterToken::new("char_b".to_string())];
      let req = unwrap_request(make_builder(|b| {
        b.reference_character_tokens = Some(CharacterListRef::CharacterTokens(tokens.clone()));
      }));
      assert_eq!(req.request.reference_character_tokens, Some(tokens));
    }
  }

  fn make_builder(f: impl FnOnce(&mut GenerateVideoRequestBuilder)) -> GenerateVideoRequestBuilder {
    let mut builder = GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance2p0PlusFast,
      provider: Provider::Artcraft,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    };
    f(&mut builder);
    builder
  }

  fn unwrap_request(builder: GenerateVideoRequestBuilder) -> ArtcraftSeedance2p0PlusFastRequestState {
    let result = build_artcraft_seedance_2p0_p_fast(builder).expect("build should succeed");
    match result {
      VideoGenerationDraftOrRequest::Request(
        VideoGenerationRequest::ArtcraftSeedance2p0PlusFast(state)
      ) => state,
      _ => panic!("expected ArtcraftSeedance2p0PlusFast request"),
    }
  }
}
