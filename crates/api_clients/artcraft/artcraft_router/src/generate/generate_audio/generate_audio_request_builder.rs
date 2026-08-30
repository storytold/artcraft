use enums::common::generation::common_musical_key::CommonMusicalKey;

use crate::api::audio_list_ref::AudioListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::api::router_audio_model::RouterAudioModel;
use crate::api::router_provider::RouterProvider;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::audio_generation_draft_or_request::AudioGenerationDraftOrRequest;
use crate::generate::generate_audio::providers::artcraft::seed_audio_1p0::build::build_artcraft_seed_audio_1p0;
use crate::generate::generate_audio::providers::artcraft::suno_music::build::build_artcraft_suno_music;
use crate::generate::generate_audio::providers::artcraft::suno_remix::build::build_artcraft_suno_remix;
use crate::generate::generate_audio::providers::artcraft::suno_sample::build::build_artcraft_suno_sample;
use crate::generate::generate_audio::providers::artcraft::suno_sounds::build::build_artcraft_suno_sounds;
use crate::generate::generate_audio::providers::fal::seed_audio_1p0::build::build_fal_seed_audio_1p0;
use crate::generate::generate_audio::providers::kinovi::suno_music::build::build_kinovi_suno_music;
use crate::generate::generate_audio::providers::kinovi::suno_remix::build::build_kinovi_suno_remix;
use crate::generate::generate_audio::providers::kinovi::suno_sample::build::build_kinovi_suno_sample;
use crate::generate::generate_audio::providers::kinovi::suno_sounds::build::build_kinovi_suno_sounds;

/// RouterProvider-agnostic audio generation request. Distilled by `build2()`
/// into an `AudioGenerationDraftOrRequest` for the selected (provider, model)
/// pair.
#[derive(Clone, Debug)]
pub struct GenerateAudioRequestBuilder {
  /// Which model to use.
  pub model: RouterAudioModel,

  /// Which provider to use.
  pub provider: RouterProvider,

  /// The prompt for the audio generation.
  pub prompt: Option<String>,

  /// Style/genre direction (Suno's "tags"), e.g. "EDM style meets dance".
  pub style_prompt: Option<String>,

  /// Reference audio (optional).
  /// The remix/sample source, or Seed Audio @Audio references (up to 3).
  pub audio_references: Option<AudioListRef>,

  /// Reference images (optional).
  /// Seed Audio supports a single reference image; it cannot be combined
  /// with audio references.
  pub image_references: Option<ImageListRef>,

  /// Whether to keep the original lyrics (Suno Remix).
  pub keep_lyrics: Option<bool>,

  /// Whether to generate instrumental-only audio (Suno Music / Sample).
  pub is_instrumental: Option<bool>,

  /// Whether the sound should loop vs a single hit (Suno Sounds).
  pub is_loopable: Option<bool>,

  /// Beats per minute (Suno Sounds).
  pub bpm: Option<u16>,

  /// The musical key to use (Suno Sounds).
  pub musical_key: Option<CommonMusicalKey>,

  /// Output sample rate in Hz (Seed Audio).
  pub sample_rate_hz: Option<u32>,

  /// Playback speed multiplier (Seed Audio: 0.5–2.0).
  pub speed: Option<f64>,

  /// Volume multiplier (Seed Audio: 0.5–2.0).
  pub volume: Option<f64>,

  /// Pitch shift in semitones (Seed Audio: -12..=12).
  pub pitch: Option<f64>,

  /// If the request is a mismatch with the (model/provider), how to mitigate it.
  pub request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy,

  /// Some providers support idempotency.
  /// If not supplied, we'll generate one for the required providers.
  pub idempotency_token: Option<String>,
}

impl Default for GenerateAudioRequestBuilder {
  fn default() -> Self {
    Self {
      model: RouterAudioModel::SunoMusic,
      provider: RouterProvider::Artcraft,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      prompt: None,
      style_prompt: None,
      audio_references: None,
      image_references: None,
      keep_lyrics: None,
      is_instrumental: None,
      is_loopable: None,
      bpm: None,
      musical_key: None,
      sample_rate_hz: None,
      speed: None,
      volume: None,
      pitch: None,
      idempotency_token: None,
    }
  }
}

impl GenerateAudioRequestBuilder {

  pub fn build2(self) -> Result<AudioGenerationDraftOrRequest, ArtcraftRouterError> {
    match (self.provider, self.model) {
      // Artcraft
      (RouterProvider::Artcraft, RouterAudioModel::SunoMusic) => build_artcraft_suno_music(self),
      (RouterProvider::Artcraft, RouterAudioModel::SunoRemix) => build_artcraft_suno_remix(self),
      (RouterProvider::Artcraft, RouterAudioModel::SunoSounds) => build_artcraft_suno_sounds(self),
      (RouterProvider::Artcraft, RouterAudioModel::SunoSample) => build_artcraft_suno_sample(self),
      (RouterProvider::Artcraft, RouterAudioModel::SeedAudio1p0) => build_artcraft_seed_audio_1p0(self),
      // Fal
      (RouterProvider::Fal, RouterAudioModel::SeedAudio1p0) => build_fal_seed_audio_1p0(self),
      // Kinovi
      (RouterProvider::KinoviWeb, RouterAudioModel::SunoMusic) => build_kinovi_suno_music(self),
      (RouterProvider::KinoviWeb, RouterAudioModel::SunoRemix) => build_kinovi_suno_remix(self),
      (RouterProvider::KinoviWeb, RouterAudioModel::SunoSounds) => build_kinovi_suno_sounds(self),
      (RouterProvider::KinoviWeb, RouterAudioModel::SunoSample) => build_kinovi_suno_sample(self),
      _ => self.unsupported_provider_and_model(),
    }
  }

  pub fn get_or_generate_idempotency_token(&self) -> String {
    self.idempotency_token.clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
  }

  fn unsupported_provider_and_model(&self) -> Result<AudioGenerationDraftOrRequest, ArtcraftRouterError> {
    Err(ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(
      format!("Audio generation for model `{:?}` is not supported for provider {:?}", self.model, self.provider)
    ))
  }
}

#[cfg(test)]
mod tests {
  use crate::generate::generate_audio::audio_generation_draft::AudioGenerationDraftRequest;
  use crate::generate::generate_audio::audio_generation_request::AudioGenerationRequest;

  use super::*;

  mod dispatch_tests {
    use super::*;

    #[test]
    fn artcraft_suno_music_dispatches() {
      let result = builder(RouterProvider::Artcraft, RouterAudioModel::SunoMusic).build2().expect("build");
      assert!(matches!(
        result,
        AudioGenerationDraftOrRequest::Request(AudioGenerationRequest::ArtcraftSunoMusic(_))
      ));
    }

    #[test]
    fn artcraft_suno_remix_dispatches() {
      let result = builder_with_audio_token_ref(RouterProvider::Artcraft, RouterAudioModel::SunoRemix).build2().expect("build");
      assert!(matches!(
        result,
        AudioGenerationDraftOrRequest::Request(AudioGenerationRequest::ArtcraftSunoRemix(_))
      ));
    }

    #[test]
    fn artcraft_suno_sounds_dispatches() {
      let result = builder(RouterProvider::Artcraft, RouterAudioModel::SunoSounds).build2().expect("build");
      assert!(matches!(
        result,
        AudioGenerationDraftOrRequest::Request(AudioGenerationRequest::ArtcraftSunoSounds(_))
      ));
    }

    #[test]
    fn artcraft_suno_sample_dispatches() {
      let result = builder_with_audio_token_ref(RouterProvider::Artcraft, RouterAudioModel::SunoSample).build2().expect("build");
      assert!(matches!(
        result,
        AudioGenerationDraftOrRequest::Request(AudioGenerationRequest::ArtcraftSunoSample(_))
      ));
    }

    #[test]
    fn artcraft_seed_audio_1p0_dispatches() {
      let result = builder(RouterProvider::Artcraft, RouterAudioModel::SeedAudio1p0).build2().expect("build");
      assert!(matches!(
        result,
        AudioGenerationDraftOrRequest::Request(AudioGenerationRequest::ArtcraftSeedAudio1p0(_))
      ));
    }

    #[test]
    fn fal_seed_audio_1p0_dispatches() {
      let result = builder(RouterProvider::Fal, RouterAudioModel::SeedAudio1p0).build2().expect("build");
      assert!(matches!(
        result,
        AudioGenerationDraftOrRequest::Request(AudioGenerationRequest::FalSeedAudio1p0(_))
      ));
    }

    #[test]
    fn kinovi_suno_music_dispatches_to_request() {
      let result = builder(RouterProvider::KinoviWeb, RouterAudioModel::SunoMusic).build2().expect("build");
      assert!(matches!(
        result,
        AudioGenerationDraftOrRequest::Request(AudioGenerationRequest::KinoviSunoMusic(_))
      ));
    }

    #[test]
    fn kinovi_suno_sounds_dispatches_to_request() {
      let result = builder(RouterProvider::KinoviWeb, RouterAudioModel::SunoSounds).build2().expect("build");
      assert!(matches!(
        result,
        AudioGenerationDraftOrRequest::Request(AudioGenerationRequest::KinoviSunoSounds(_))
      ));
    }

    #[test]
    fn kinovi_suno_remix_dispatches_to_draft() {
      let result = builder_with_audio_ref(RouterProvider::KinoviWeb, RouterAudioModel::SunoRemix).build2().expect("build");
      assert!(matches!(
        result,
        AudioGenerationDraftOrRequest::Draft(AudioGenerationDraftRequest::KinoviSunoRemix(_))
      ));
    }

    #[test]
    fn kinovi_suno_sample_dispatches_to_draft() {
      let result = builder_with_audio_ref(RouterProvider::KinoviWeb, RouterAudioModel::SunoSample).build2().expect("build");
      assert!(matches!(
        result,
        AudioGenerationDraftOrRequest::Draft(AudioGenerationDraftRequest::KinoviSunoSample(_))
      ));
    }
  }

  mod unsupported_combo_tests {
    use super::*;

    #[test]
    fn kinovi_seed_audio_1p0_is_unsupported() {
      let result = builder(RouterProvider::KinoviWeb, RouterAudioModel::SeedAudio1p0).build2();
      assert!(matches!(result, Err(ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(_))));
    }

    #[test]
    fn fal_suno_models_are_unsupported() {
      for model in [
        RouterAudioModel::SunoMusic,
        RouterAudioModel::SunoRemix,
        RouterAudioModel::SunoSounds,
        RouterAudioModel::SunoSample,
      ] {
        let result = builder(RouterProvider::Fal, model).build2();
        assert!(
          matches!(result, Err(ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(_))),
          "expected unsupported error for Fal + {model:?}",
        );
      }
    }

    #[test]
    fn gmicloud_and_grok_are_unsupported() {
      for provider in [RouterProvider::GmiCloud, RouterProvider::GrokApi] {
        let result = builder(provider, RouterAudioModel::SunoMusic).build2();
        assert!(
          matches!(result, Err(ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(_))),
          "expected unsupported error for {provider:?}",
        );
      }
    }
  }

  // ── Helpers ──

  fn builder(provider: RouterProvider, model: RouterAudioModel) -> GenerateAudioRequestBuilder {
    GenerateAudioRequestBuilder {
      provider,
      model,
      prompt: Some("a song about corgis".to_string()),
      ..Default::default()
    }
  }

  fn builder_with_audio_ref(provider: RouterProvider, model: RouterAudioModel) -> GenerateAudioRequestBuilder {
    GenerateAudioRequestBuilder {
      audio_references: Some(AudioListRef::Urls(vec!["https://example.com/a.mp3".to_string()])),
      ..builder(provider, model)
    }
  }

  fn builder_with_audio_token_ref(provider: RouterProvider, model: RouterAudioModel) -> GenerateAudioRequestBuilder {
    use tokens::tokens::media_files::MediaFileToken;
    GenerateAudioRequestBuilder {
      audio_references: Some(AudioListRef::MediaFileTokens(vec![MediaFileToken::new("mf_test123".to_string())])),
      ..builder(provider, model)
    }
  }
}
