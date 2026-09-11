use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_audio_cost_and_generate_request::OmniGenAudioCostAndGenerateRequest;
use enums::common::generation::common_audio_model::CommonAudioModel as CommonAudioModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
use crate::generate::generate_audio::providers::artcraft::resolve::{
  resolve_audio_list_ref, resolve_image_list_ref,
};

/// Build an `OmniGenAudioCostAndGenerateRequest` from the builder. The
/// Artcraft provider is a thin forwarding shim: the storyteller-web omni
/// audio endpoint owns per-model validation and option mapping, so the
/// builder's options are passed through as-is.
pub fn build_artcraft_omni_audio_request(
  mut builder: GenerateAudioRequestBuilder,
  model: CommonAudioModelEnum,
) -> Result<OmniGenAudioCostAndGenerateRequest, ArtcraftRouterError> {
  let audio_media_tokens = resolve_audio_list_ref(builder.audio_references.take())?;
  let image_media_tokens = resolve_image_list_ref(builder.image_references.take())?;
  let idempotency_token = builder.get_or_generate_idempotency_token();

  Ok(OmniGenAudioCostAndGenerateRequest {
    idempotency_token: Some(idempotency_token),
    model: Some(model),
    prompt: builder.prompt.take(),
    style_prompt: builder.style_prompt.take(),
    audio_media_tokens,
    image_media_tokens,
    keep_lyrics: builder.keep_lyrics,
    is_instrumental: builder.is_instrumental,
    is_loopable: builder.is_loopable,
    bpm: builder.bpm,
    musical_key: builder.musical_key,
    sample_rate_hz: builder.sample_rate_hz,
    speed: builder.speed,
    volume: builder.volume,
    pitch: builder.pitch,
  })
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::audio_list_ref::AudioListRef;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;
  use crate::errors::client_error::ClientError;

  use super::*;

  #[test]
  fn all_fields_are_forwarded() {
    use enums::common::generation::common_musical_key::CommonMusicalKey;

    let builder = GenerateAudioRequestBuilder {
      prompt: Some("a song".to_string()),
      style_prompt: Some("EDM".to_string()),
      audio_references: Some(AudioListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_audio".to_string()),
      ])),
      image_references: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_image".to_string()),
      ])),
      keep_lyrics: Some(true),
      is_instrumental: Some(false),
      is_loopable: Some(true),
      bpm: Some(120),
      musical_key: Some(CommonMusicalKey::AMinor),
      sample_rate_hz: Some(48_000),
      speed: Some(1.5),
      volume: Some(0.8),
      pitch: Some(-2.0),
      idempotency_token: Some("test-token".to_string()),
      ..base_builder()
    };

    let request = build_artcraft_omni_audio_request(builder, CommonAudioModelEnum::SunoMusic)
      .expect("build");

    assert_eq!(request.idempotency_token.as_deref(), Some("test-token"));
    assert_eq!(request.model, Some(CommonAudioModelEnum::SunoMusic));
    assert_eq!(request.prompt.as_deref(), Some("a song"));
    assert_eq!(request.style_prompt.as_deref(), Some("EDM"));
    assert_eq!(request.audio_media_tokens.as_ref().map(|t| t.len()), Some(1));
    assert_eq!(request.image_media_tokens.as_ref().map(|t| t.len()), Some(1));
    assert_eq!(request.keep_lyrics, Some(true));
    assert_eq!(request.is_instrumental, Some(false));
    assert_eq!(request.is_loopable, Some(true));
    assert_eq!(request.bpm, Some(120));
    assert_eq!(request.musical_key, Some(CommonMusicalKey::AMinor));
    assert_eq!(request.sample_rate_hz, Some(48_000));
    assert_eq!(request.speed, Some(1.5));
    assert_eq!(request.volume, Some(0.8));
    assert_eq!(request.pitch, Some(-2.0));
  }

  #[test]
  fn idempotency_token_is_generated_when_missing() {
    let request = build_artcraft_omni_audio_request(base_builder(), CommonAudioModelEnum::SunoMusic)
      .expect("build");
    assert!(request.idempotency_token.is_some());
    assert!(!request.idempotency_token.unwrap().is_empty());
  }

  #[test]
  fn audio_url_references_are_rejected() {
    let builder = GenerateAudioRequestBuilder {
      audio_references: Some(AudioListRef::Urls(vec!["https://example.com/a.mp3".to_string()])),
      ..base_builder()
    };
    let result = build_artcraft_omni_audio_request(builder, CommonAudioModelEnum::SunoRemix);
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }

  #[test]
  fn image_url_references_are_rejected() {
    let builder = GenerateAudioRequestBuilder {
      image_references: Some(ImageListRef::Urls(vec!["https://example.com/a.png".to_string()])),
      ..base_builder()
    };
    let result = build_artcraft_omni_audio_request(builder, CommonAudioModelEnum::SeedAudio1p0);
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }

  // ── Helpers ──

  fn base_builder() -> GenerateAudioRequestBuilder {
    GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoMusic,
      provider: RouterProvider::Artcraft,
      prompt: Some("a song".to_string()),
      ..Default::default()
    }
  }
}
