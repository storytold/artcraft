use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_u::request::ArtcraftSeedance2p0UltraRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_seedance_2p0_u(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Seedance2p0Ultra,
    SupportedResolutions::Full,
    UltraWideSupport::Supported,
  )?;
  let state = ArtcraftSeedance2p0UltraRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftSeedance2p0Ultra(state)))
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
  use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;
  use tokens::tokens::characters::CharacterToken;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::character_list_ref::CharacterListRef;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

  use super::*;

  // ── Field conversions ──

  mod field_conversions {
    use super::*;

    #[test]
    fn model_is_seedance_2p0() {
      let req = unwrap_request(make_builder(|_| {}));
      assert!(matches!(req.request.model, Some(CommonVideoModelEnum::Seedance2p0Ultra)));
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

  // ── Resolution ──

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
    fn res_1080p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(CommonResolution::TenEightyP); }));
      assert_eq!(req.request.resolution, Some(CommonResolutionEnum::TenEightyP));
    }

    #[test]
    fn none_stays_none() {
      let req = unwrap_request(make_builder(|_| {}));
      assert!(req.request.resolution.is_none());
    }
  }

  // ── Media tokens ──

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
      let result = build_artcraft_seedance_2p0_u(GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::Url("https://example.com".to_string())),
        ..base_builder()
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

  // ── Helpers ──

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      provider: Provider::Artcraft,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn make_builder(f: impl FnOnce(&mut GenerateVideoRequestBuilder)) -> GenerateVideoRequestBuilder {
    let mut builder = base_builder();
    f(&mut builder);
    builder
  }

  fn unwrap_request(builder: GenerateVideoRequestBuilder) -> ArtcraftSeedance2p0UltraRequestState {
    let result = build_artcraft_seedance_2p0_u(builder).expect("build should succeed");
    match result {
      VideoGenerationDraftOrRequest::Request(
        VideoGenerationRequest::ArtcraftSeedance2p0Ultra(state)
      ) => state,
      _ => panic!("expected ArtcraftSeedance2p0 request"),
    }
  }
}
