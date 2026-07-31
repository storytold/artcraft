use seedance2pro_web_client::generate::audio::generate_suno_music::GenerateSunoMusicRequest;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::audio_generation_draft_or_request::AudioGenerationDraftOrRequest;
use crate::generate::generate_audio::audio_generation_request::AudioGenerationRequest;
use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
use crate::generate::generate_audio::providers::kinovi::suno_music::request::KinoviSunoMusicRequestState;
use crate::generate::generate_audio::providers::reject_unsupported::{
  reject_unsupported_audio_references, reject_unsupported_image_references,
  reject_unsupported_option,
};

pub fn build_kinovi_suno_music(builder: GenerateAudioRequestBuilder) -> Result<AudioGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_kinovi_suno_music_state(builder)?;
  Ok(AudioGenerationDraftOrRequest::Request(AudioGenerationRequest::KinoviSunoMusic(state)))
}

pub(crate) fn build_kinovi_suno_music_state(
  mut builder: GenerateAudioRequestBuilder,
) -> Result<KinoviSunoMusicRequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Options Suno Music has no equivalent for.
  reject_unsupported_option("keep_lyrics", builder.keep_lyrics.as_ref(), strategy)?;
  reject_unsupported_option("is_loopable", builder.is_loopable.as_ref(), strategy)?;
  reject_unsupported_option("bpm", builder.bpm.as_ref(), strategy)?;
  reject_unsupported_option("musical_key", builder.musical_key.as_ref(), strategy)?;
  reject_unsupported_option("sample_rate_hz", builder.sample_rate_hz.as_ref(), strategy)?;
  reject_unsupported_option("speed", builder.speed.as_ref(), strategy)?;
  reject_unsupported_option("volume", builder.volume.as_ref(), strategy)?;
  reject_unsupported_option("pitch", builder.pitch.as_ref(), strategy)?;
  reject_unsupported_audio_references(builder.audio_references.as_ref(), strategy)?;
  reject_unsupported_image_references(builder.image_references.as_ref(), strategy)?;

  let prompt = builder.prompt.take().ok_or_else(|| {
    ArtcraftRouterError::InvalidInput("A prompt is required for Suno Music".to_string())
  })?;

  let request = GenerateSunoMusicRequest {
    prompt,
    style_tags: builder.style_prompt.take(),
    instrumental: builder.is_instrumental.unwrap_or(false),
  };

  Ok(KinoviSunoMusicRequestState { request })
}

#[cfg(test)]
mod tests {
  use crate::api::audio_list_ref::AudioListRef;
  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;

  use super::*;

  #[test]
  fn prompt_and_style_are_passed_through() {
    let state = build_kinovi_suno_music_state(base_builder()).expect("build");
    assert_eq!(state.request.prompt, "a song about corgis");
    assert_eq!(state.request.style_tags.as_deref(), Some("sea shanty"));
  }

  #[test]
  fn missing_prompt_is_rejected() {
    let builder = GenerateAudioRequestBuilder { prompt: None, ..base_builder() };
    assert!(build_kinovi_suno_music_state(builder).is_err());
  }

  #[test]
  fn instrumental_defaults_to_false() {
    let state = build_kinovi_suno_music_state(base_builder()).expect("build");
    assert!(!state.request.instrumental);
  }

  #[test]
  fn instrumental_passes_through() {
    let builder = GenerateAudioRequestBuilder { is_instrumental: Some(true), ..base_builder() };
    let state = build_kinovi_suno_music_state(builder).expect("build");
    assert!(state.request.instrumental);
  }

  #[test]
  fn unsupported_options_error_out() {
    let error_out = RequestMismatchMitigationStrategy::ErrorOut;
    let cases: Vec<GenerateAudioRequestBuilder> = vec![
      GenerateAudioRequestBuilder { keep_lyrics: Some(true), ..base_builder() },
      GenerateAudioRequestBuilder { is_loopable: Some(true), ..base_builder() },
      GenerateAudioRequestBuilder { bpm: Some(120), ..base_builder() },
      GenerateAudioRequestBuilder { sample_rate_hz: Some(48_000), ..base_builder() },
      GenerateAudioRequestBuilder { speed: Some(1.5), ..base_builder() },
      GenerateAudioRequestBuilder { volume: Some(0.5), ..base_builder() },
      GenerateAudioRequestBuilder { pitch: Some(2.0), ..base_builder() },
      GenerateAudioRequestBuilder {
        audio_references: Some(AudioListRef::Urls(vec!["https://example.com/a.mp3".to_string()])),
        ..base_builder()
      },
    ];
    for mut builder in cases {
      builder.request_mismatch_mitigation_strategy = error_out;
      assert!(build_kinovi_suno_music_state(builder).is_err());
    }
  }

  #[test]
  fn unsupported_options_are_dropped_under_lenient_strategies() {
    let builder = GenerateAudioRequestBuilder {
      keep_lyrics: Some(true),
      bpm: Some(120),
      speed: Some(1.5),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      ..base_builder()
    };
    assert!(build_kinovi_suno_music_state(builder).is_ok());
  }

  // ── Helpers ──

  fn base_builder() -> GenerateAudioRequestBuilder {
    GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoMusic,
      provider: RouterProvider::Seedance2Pro,
      prompt: Some("a song about corgis".to_string()),
      style_prompt: Some("sea shanty".to_string()),
      ..Default::default()
    }
  }
}
