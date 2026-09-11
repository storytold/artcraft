use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_splat_cost_and_generate_request::OmniGenSplatCostAndGenerateRequest;
use enums::common::generation::common_splat_model::CommonSplatModel as CommonSplatModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
use crate::generate::generate_splat::providers::artcraft::resolve::{
  resolve_image_list_ref, resolve_video_ref,
};

/// Build an `OmniGenSplatCostAndGenerateRequest` from the builder. The
/// Artcraft provider is a thin forwarding shim: the storyteller-web omni
/// splat endpoint owns per-model validation and option mapping, so the
/// builder's options are passed through as-is.
pub fn build_artcraft_omni_splat_request(
  mut builder: GenerateSplatRequestBuilder,
  model: CommonSplatModelEnum,
) -> Result<OmniGenSplatCostAndGenerateRequest, ArtcraftRouterError> {
  let reference_image_media_tokens = resolve_image_list_ref(builder.reference_images.take())?;
  let reference_video_media_token = resolve_video_ref(builder.reference_video.take())?;
  let idempotency_token = builder.get_or_generate_idempotency_token();

  Ok(OmniGenSplatCostAndGenerateRequest {
    idempotency_token: Some(idempotency_token),
    model: Some(model),
    prompt: builder.prompt.take(),
    reference_image_media_tokens,
    reference_video_media_token,
    is_panoramic: builder.is_panoramic,
    disable_recaption: builder.disable_recaption,
  })
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_splat_model::RouterSplatModel;
  use crate::api::video_ref::VideoRef;
  use crate::errors::client_error::ClientError;

  use super::*;

  #[test]
  fn all_fields_are_forwarded() {
    let builder = GenerateSplatRequestBuilder {
      prompt: Some("a cozy cabin".to_string()),
      reference_images: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_image".to_string()),
      ])),
      reference_video: Some(VideoRef::MediaFileToken(MediaFileToken::new("mf_video".to_string()))),
      is_panoramic: Some(true),
      disable_recaption: Some(true),
      idempotency_token: Some("test-token".to_string()),
      ..base_builder()
    };

    let request = build_artcraft_omni_splat_request(builder, CommonSplatModelEnum::Marble1p0)
      .expect("build");

    assert_eq!(request.idempotency_token.as_deref(), Some("test-token"));
    assert_eq!(request.model, Some(CommonSplatModelEnum::Marble1p0));
    assert_eq!(request.prompt.as_deref(), Some("a cozy cabin"));
    assert_eq!(request.reference_image_media_tokens.as_ref().map(|t| t.len()), Some(1));
    assert_eq!(request.reference_video_media_token.as_ref().map(|t| t.as_str()), Some("mf_video"));
    assert_eq!(request.is_panoramic, Some(true));
    assert_eq!(request.disable_recaption, Some(true));
  }

  #[test]
  fn idempotency_token_is_generated_when_missing() {
    let request = build_artcraft_omni_splat_request(base_builder(), CommonSplatModelEnum::Marble1p0Draft)
      .expect("build");
    assert!(request.idempotency_token.is_some());
    assert!(!request.idempotency_token.unwrap().is_empty());
  }

  #[test]
  fn image_url_references_are_rejected() {
    let builder = GenerateSplatRequestBuilder {
      reference_images: Some(ImageListRef::Urls(vec!["https://example.com/a.png".to_string()])),
      ..base_builder()
    };
    let result = build_artcraft_omni_splat_request(builder, CommonSplatModelEnum::Marble1p0);
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }

  #[test]
  fn video_url_references_are_rejected() {
    let builder = GenerateSplatRequestBuilder {
      reference_video: Some(VideoRef::Url("https://example.com/a.mp4".to_string())),
      ..base_builder()
    };
    let result = build_artcraft_omni_splat_request(builder, CommonSplatModelEnum::Marble1p0);
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }

  // ── Helpers ──

  fn base_builder() -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      model: RouterSplatModel::Marble1p0,
      provider: RouterProvider::Artcraft,
      prompt: Some("a cozy cabin".to_string()),
      ..Default::default()
    }
  }
}
