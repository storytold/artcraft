use enums::common::generation::common_musical_key::CommonMusicalKey;
use kinovi_web_client::generate::audio::generate_suno_sound::{
  GenerateSunoSoundRequest, KinoviSunoSoundKey, KinoviSunoSoundType,
};

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::audio_generation_draft_or_request::AudioGenerationDraftOrRequest;
use crate::generate::generate_audio::audio_generation_request::AudioGenerationRequest;
use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
use crate::generate::generate_audio::providers::kinovi::suno_sounds::request::KinoviSunoSoundsRequestState;
use crate::generate::generate_audio::providers::reject_unsupported::{
  reject_unsupported_audio_references, reject_unsupported_image_references,
  reject_unsupported_option,
};

pub fn build_kinovi_suno_sounds(builder: GenerateAudioRequestBuilder) -> Result<AudioGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_kinovi_suno_sounds_state(builder)?;
  Ok(AudioGenerationDraftOrRequest::Request(AudioGenerationRequest::KinoviSunoSounds(state)))
}

pub(crate) fn build_kinovi_suno_sounds_state(
  mut builder: GenerateAudioRequestBuilder,
) -> Result<KinoviSunoSoundsRequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Options Suno Sounds has no equivalent for.
  reject_unsupported_option("style_prompt", builder.style_prompt.as_ref(), strategy)?;
  reject_unsupported_option("keep_lyrics", builder.keep_lyrics.as_ref(), strategy)?;
  reject_unsupported_option("is_instrumental", builder.is_instrumental.as_ref(), strategy)?;
  reject_unsupported_option("sample_rate_hz", builder.sample_rate_hz.as_ref(), strategy)?;
  reject_unsupported_option("speed", builder.speed.as_ref(), strategy)?;
  reject_unsupported_option("volume", builder.volume.as_ref(), strategy)?;
  reject_unsupported_option("pitch", builder.pitch.as_ref(), strategy)?;
  reject_unsupported_audio_references(builder.audio_references.as_ref(), strategy)?;
  reject_unsupported_image_references(builder.image_references.as_ref(), strategy)?;

  let prompt = builder.prompt.take().ok_or_else(|| {
    ArtcraftRouterError::InvalidInput("A prompt is required for Suno Sounds".to_string())
  })?;

  let request = GenerateSunoSoundRequest {
    prompt,
    sound_type: plan_sound_type(builder.is_loopable),
    bpm: builder.bpm,
    key: plan_key(builder.musical_key),
  };

  Ok(KinoviSunoSoundsRequestState { request })
}

// ── Plan helpers ──

fn plan_sound_type(is_loopable: Option<bool>) -> KinoviSunoSoundType {
  match is_loopable {
    Some(true) => KinoviSunoSoundType::Loopable,
    Some(false) | None => KinoviSunoSoundType::SingleHit,
  }
}

fn plan_key(musical_key: Option<CommonMusicalKey>) -> KinoviSunoSoundKey {
  match musical_key {
    None | Some(CommonMusicalKey::Auto) => KinoviSunoSoundKey::Auto,
    Some(CommonMusicalKey::CMajor) => KinoviSunoSoundKey::CMajor,
    Some(CommonMusicalKey::CMinor) => KinoviSunoSoundKey::CMinor,
    Some(CommonMusicalKey::DMajor) => KinoviSunoSoundKey::DMajor,
    Some(CommonMusicalKey::DMinor) => KinoviSunoSoundKey::DMinor,
    Some(CommonMusicalKey::FMajor) => KinoviSunoSoundKey::FMajor,
    Some(CommonMusicalKey::FMinor) => KinoviSunoSoundKey::FMinor,
    Some(CommonMusicalKey::GMajor) => KinoviSunoSoundKey::GMajor,
    Some(CommonMusicalKey::GMinor) => KinoviSunoSoundKey::GMinor,
    Some(CommonMusicalKey::AMajor) => KinoviSunoSoundKey::AMajor,
    Some(CommonMusicalKey::AMinor) => KinoviSunoSoundKey::AMinor,
    Some(CommonMusicalKey::BMajor) => KinoviSunoSoundKey::BMajor,
    Some(CommonMusicalKey::BMinor) => KinoviSunoSoundKey::BMinor,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;

  use super::*;

  mod field_conversions {
    use super::*;

    #[test]
    fn prompt_is_passed_through() {
      let state = build_kinovi_suno_sounds_state(base_builder()).expect("build");
      assert_eq!(state.request.prompt, "rain sound effects");
    }

    #[test]
    fn missing_prompt_is_rejected() {
      let builder = GenerateAudioRequestBuilder { prompt: None, ..base_builder() };
      assert!(build_kinovi_suno_sounds_state(builder).is_err());
    }

    #[test]
    fn bpm_passes_through() {
      let builder = GenerateAudioRequestBuilder { bpm: Some(120), ..base_builder() };
      let state = build_kinovi_suno_sounds_state(builder).expect("build");
      assert_eq!(state.request.bpm, Some(120));
    }

    #[test]
    fn loopable_true_maps_to_loop() {
      let builder = GenerateAudioRequestBuilder { is_loopable: Some(true), ..base_builder() };
      let state = build_kinovi_suno_sounds_state(builder).expect("build");
      assert!(matches!(state.request.sound_type, KinoviSunoSoundType::Loopable));
    }

    #[test]
    fn loopable_false_maps_to_single_hit() {
      let builder = GenerateAudioRequestBuilder { is_loopable: Some(false), ..base_builder() };
      let state = build_kinovi_suno_sounds_state(builder).expect("build");
      assert!(matches!(state.request.sound_type, KinoviSunoSoundType::SingleHit));
    }

    #[test]
    fn loopable_none_defaults_to_single_hit() {
      let state = build_kinovi_suno_sounds_state(base_builder()).expect("build");
      assert!(matches!(state.request.sound_type, KinoviSunoSoundType::SingleHit));
    }
  }

  mod key_mapping {
    use super::*;

    #[test]
    fn every_common_key_maps_to_the_kinovi_key() {
      let cases = [
        (Some(CommonMusicalKey::Auto), KinoviSunoSoundKey::Auto),
        (Some(CommonMusicalKey::CMajor), KinoviSunoSoundKey::CMajor),
        (Some(CommonMusicalKey::CMinor), KinoviSunoSoundKey::CMinor),
        (Some(CommonMusicalKey::DMajor), KinoviSunoSoundKey::DMajor),
        (Some(CommonMusicalKey::DMinor), KinoviSunoSoundKey::DMinor),
        (Some(CommonMusicalKey::FMajor), KinoviSunoSoundKey::FMajor),
        (Some(CommonMusicalKey::FMinor), KinoviSunoSoundKey::FMinor),
        (Some(CommonMusicalKey::GMajor), KinoviSunoSoundKey::GMajor),
        (Some(CommonMusicalKey::GMinor), KinoviSunoSoundKey::GMinor),
        (Some(CommonMusicalKey::AMajor), KinoviSunoSoundKey::AMajor),
        (Some(CommonMusicalKey::AMinor), KinoviSunoSoundKey::AMinor),
        (Some(CommonMusicalKey::BMajor), KinoviSunoSoundKey::BMajor),
        (Some(CommonMusicalKey::BMinor), KinoviSunoSoundKey::BMinor),
      ];
      assert_eq!(cases.len(), 13, "expected all 13 CommonMusicalKey variants covered");
      for (common_key, expected) in cases {
        let builder = GenerateAudioRequestBuilder { musical_key: common_key, ..base_builder() };
        let state = build_kinovi_suno_sounds_state(builder).expect("build");
        assert!(
          matches!(state.request.key, k if format!("{k:?}") == format!("{expected:?}")),
          "expected {expected:?} for {common_key:?}, got {:?}", state.request.key,
        );
      }
    }

    #[test]
    fn missing_key_defaults_to_auto() {
      let state = build_kinovi_suno_sounds_state(base_builder()).expect("build");
      assert!(matches!(state.request.key, KinoviSunoSoundKey::Auto));
    }
  }

  mod unsupported_options {
    use super::*;

    #[test]
    fn unsupported_options_error_out() {
      let cases: Vec<GenerateAudioRequestBuilder> = vec![
        GenerateAudioRequestBuilder { style_prompt: Some("EDM".to_string()), ..base_builder() },
        GenerateAudioRequestBuilder { keep_lyrics: Some(true), ..base_builder() },
        GenerateAudioRequestBuilder { is_instrumental: Some(true), ..base_builder() },
        GenerateAudioRequestBuilder { sample_rate_hz: Some(48_000), ..base_builder() },
        GenerateAudioRequestBuilder { speed: Some(1.5), ..base_builder() },
        GenerateAudioRequestBuilder { volume: Some(0.5), ..base_builder() },
        GenerateAudioRequestBuilder { pitch: Some(2.0), ..base_builder() },
      ];
      for mut builder in cases {
        builder.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
        assert!(build_kinovi_suno_sounds_state(builder).is_err());
      }
    }

    #[test]
    fn unsupported_options_are_dropped_under_lenient_strategies() {
      let builder = GenerateAudioRequestBuilder {
        style_prompt: Some("EDM".to_string()),
        is_instrumental: Some(true),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
        ..base_builder()
      };
      assert!(build_kinovi_suno_sounds_state(builder).is_ok());
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateAudioRequestBuilder {
    GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoSounds,
      provider: RouterProvider::KinoviWeb,
      prompt: Some("rain sound effects".to_string()),
      ..Default::default()
    }
  }
}
