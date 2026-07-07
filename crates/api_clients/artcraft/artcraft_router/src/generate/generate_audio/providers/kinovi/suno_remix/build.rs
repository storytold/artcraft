use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::audio_generation_draft::AudioGenerationDraftRequest;
use crate::generate::generate_audio::audio_generation_draft_or_request::AudioGenerationDraftOrRequest;
use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
use crate::generate::generate_audio::providers::kinovi::resolve::require_single_audio_ref;
use crate::generate::generate_audio::providers::kinovi::suno_remix::draft::KinoviSunoRemixDraftState;
use crate::generate::generate_audio::providers::reject_unsupported::{
  reject_unsupported_image_references, reject_unsupported_option,
};

pub fn build_kinovi_suno_remix(builder: GenerateAudioRequestBuilder) -> Result<AudioGenerationDraftOrRequest, ArtcraftRouterError> {
  let draft = build_kinovi_suno_remix_draft(builder)?;
  Ok(AudioGenerationDraftOrRequest::Draft(AudioGenerationDraftRequest::KinoviSunoRemix(draft)))
}

pub(crate) fn build_kinovi_suno_remix_draft(
  mut builder: GenerateAudioRequestBuilder,
) -> Result<KinoviSunoRemixDraftState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Options Suno Remix has no equivalent for.
  reject_unsupported_option("is_instrumental", builder.is_instrumental.as_ref(), strategy)?;
  reject_unsupported_option("is_loopable", builder.is_loopable.as_ref(), strategy)?;
  reject_unsupported_option("bpm", builder.bpm.as_ref(), strategy)?;
  reject_unsupported_option("musical_key", builder.musical_key.as_ref(), strategy)?;
  reject_unsupported_option("sample_rate_hz", builder.sample_rate_hz.as_ref(), strategy)?;
  reject_unsupported_option("speed", builder.speed.as_ref(), strategy)?;
  reject_unsupported_option("volume", builder.volume.as_ref(), strategy)?;
  reject_unsupported_option("pitch", builder.pitch.as_ref(), strategy)?;
  reject_unsupported_image_references(builder.image_references.as_ref(), strategy)?;

  let prompt = builder.prompt.take().ok_or_else(|| {
    ArtcraftRouterError::InvalidInput("A prompt is required for Suno Remix".to_string())
  })?;

  let audio_source = require_single_audio_ref(builder.audio_references.take())?;

  Ok(KinoviSunoRemixDraftState {
    prompt,
    style_tags: builder.style_prompt.take(),
    keep_lyrics: builder.keep_lyrics.unwrap_or(false),
    audio_source: Some(audio_source),
  })
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::audio_list_ref::AudioListRef;
  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_audio::providers::kinovi::resolve::SingleAudioRef;

  use super::*;

  mod field_conversions {
    use super::*;

    #[test]
    fn prompt_and_style_are_passed_through() {
      let draft = build_kinovi_suno_remix_draft(base_builder()).expect("build");
      assert_eq!(draft.prompt, "make this electronic");
      assert_eq!(draft.style_tags.as_deref(), Some("EDM style"));
    }

    #[test]
    fn missing_prompt_is_rejected() {
      let builder = GenerateAudioRequestBuilder { prompt: None, ..base_builder() };
      assert!(build_kinovi_suno_remix_draft(builder).is_err());
    }

    #[test]
    fn keep_lyrics_defaults_to_false() {
      let draft = build_kinovi_suno_remix_draft(base_builder()).expect("build");
      assert!(!draft.keep_lyrics);
    }

    #[test]
    fn keep_lyrics_passes_through() {
      let builder = GenerateAudioRequestBuilder { keep_lyrics: Some(true), ..base_builder() };
      let draft = build_kinovi_suno_remix_draft(builder).expect("build");
      assert!(draft.keep_lyrics);
    }
  }

  mod audio_reference_requirements {
    use super::*;

    #[test]
    fn exactly_one_url_reference_is_accepted() {
      let draft = build_kinovi_suno_remix_draft(base_builder()).expect("build");
      assert!(matches!(
        draft.audio_source,
        Some(SingleAudioRef::Url(url)) if url == "https://example.com/a.mp3"
      ));
    }

    #[test]
    fn a_media_token_reference_is_accepted() {
      let builder = GenerateAudioRequestBuilder {
        audio_references: Some(AudioListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_test123".to_string()),
        ])),
        ..base_builder()
      };
      let draft = build_kinovi_suno_remix_draft(builder).expect("build");
      assert!(matches!(
        draft.audio_source,
        Some(SingleAudioRef::MediaFileToken(t)) if t.as_str() == "mf_test123"
      ));
    }

    #[test]
    fn zero_references_are_rejected() {
      let builder = GenerateAudioRequestBuilder { audio_references: None, ..base_builder() };
      assert!(build_kinovi_suno_remix_draft(builder).is_err());
    }

    #[test]
    fn two_references_are_rejected() {
      let builder = GenerateAudioRequestBuilder {
        audio_references: Some(AudioListRef::Urls(vec![
          "https://example.com/a.mp3".to_string(),
          "https://example.com/b.mp3".to_string(),
        ])),
        ..base_builder()
      };
      assert!(build_kinovi_suno_remix_draft(builder).is_err());
    }
  }

  mod unsupported_options {
    use super::*;

    #[test]
    fn unsupported_options_error_out() {
      let cases: Vec<GenerateAudioRequestBuilder> = vec![
        GenerateAudioRequestBuilder { is_instrumental: Some(true), ..base_builder() },
        GenerateAudioRequestBuilder { is_loopable: Some(true), ..base_builder() },
        GenerateAudioRequestBuilder { bpm: Some(120), ..base_builder() },
        GenerateAudioRequestBuilder { sample_rate_hz: Some(48_000), ..base_builder() },
        GenerateAudioRequestBuilder { speed: Some(1.5), ..base_builder() },
        GenerateAudioRequestBuilder { volume: Some(0.5), ..base_builder() },
        GenerateAudioRequestBuilder { pitch: Some(2.0), ..base_builder() },
      ];
      for mut builder in cases {
        builder.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
        assert!(build_kinovi_suno_remix_draft(builder).is_err());
      }
    }

    #[test]
    fn unsupported_options_are_dropped_under_lenient_strategies() {
      let builder = GenerateAudioRequestBuilder {
        is_instrumental: Some(true),
        bpm: Some(120),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..base_builder()
      };
      assert!(build_kinovi_suno_remix_draft(builder).is_ok());
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateAudioRequestBuilder {
    GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoRemix,
      provider: RouterProvider::Seedance2Pro,
      prompt: Some("make this electronic".to_string()),
      style_prompt: Some("EDM style".to_string()),
      audio_references: Some(AudioListRef::Urls(vec!["https://example.com/a.mp3".to_string()])),
      ..Default::default()
    }
  }
}
