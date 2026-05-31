use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video_1p5::request::ArtcraftGrokImagineVideo1p5RequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

/// Build an ArtCraft-routed Grok Imagine Video 1.5 preview request.
///
/// Same constraints as the v1 variant — xAI v1.5 still supports only 480p
/// and 720p and no 21:9 ultra-wide. The on-wire model identifier is
/// `grok-imagine-video-1.5-preview`; the cost calculator in
/// [`super::cost`] keys off that to apply the v1.5 pricing tier (with a 5%
/// ArtCraft markup on top of the upstream rates).
pub fn build_artcraft_grok_imagine_video_1p5(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::GrokImagineVideo1p5,
    SupportedResolutions::Fast,
    UltraWideSupport::Unsupported,
  )?;
  let state = ArtcraftGrokImagineVideo1p5RequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(
    VideoGenerationRequest::ArtcraftGrokImagineVideo1p5(state),
  ))
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
  use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;
  use tokens::tokens::characters::CharacterToken;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::character_list_ref::CharacterListRef;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

  use super::*;

  mod field_conversions {
    use super::*;

    #[test]
    fn model_is_grok_imagine_video_1p5() {
      let req = unwrap_request(make_builder(|_| {}));
      assert!(matches!(req.request.model, Some(CommonVideoModelEnum::GrokImagineVideo1p5)));
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
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(RouterResolution::FourEightyP); }));
      assert_eq!(req.request.resolution, Some(CommonResolutionEnum::FourEightyP));
    }

    #[test]
    fn res_720p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(RouterResolution::SevenTwentyP); }));
      assert_eq!(req.request.resolution, Some(CommonResolutionEnum::SevenTwentyP));
    }

    #[test]
    fn res_1080p_downgrades_to_720p() {
      // SupportedResolutions::Fast caps at 720p (Grok Imagine doesn't render 1080p output).
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(RouterResolution::TenEightyP); }));
      assert_eq!(req.request.resolution, Some(CommonResolutionEnum::SevenTwentyP));
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
      // ArtCraft's omni endpoint requires media tokens — URLs are rejected
      // (unlike the direct Grok provider, which is URL-only).
      let result = build_artcraft_grok_imagine_video_1p5(GenerateVideoRequestBuilder {
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

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      provider: RouterProvider::Artcraft,
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

  fn unwrap_request(builder: GenerateVideoRequestBuilder) -> ArtcraftGrokImagineVideo1p5RequestState {
    let result = build_artcraft_grok_imagine_video_1p5(builder).expect("build should succeed");
    match result {
      VideoGenerationDraftOrRequest::Request(
        VideoGenerationRequest::ArtcraftGrokImagineVideo1p5(state)
      ) => state,
      _ => panic!("expected ArtcraftGrokImagineVideo1p5 request"),
    }
  }
}
