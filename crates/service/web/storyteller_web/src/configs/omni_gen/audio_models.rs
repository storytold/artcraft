use artcraft_api_defs::omni_gen::models::omni_gen_audio_models::{
  OmniGenAudioModelDetails,
  OmniGenAudioModelProviderDetails,
  OmniGenAudioModelsResponse,
  OmniGenAudioProviderModelDetails,
};
use enums::common::generation::common_audio_model::CommonAudioModel;
use enums::common::generation::model_creator::ModelCreator;
use enums::common::generation_provider::GenerationProvider;
use once_cell::sync::Lazy;

pub static OMNI_GEN_AUDIO_MODELS_AND_PROVIDERS: Lazy<OmniGenAudioModelsResponse> = Lazy::new(|| {
  let models = build_omni_gen_audio_models();
  let providers = build_omni_gen_audio_model_providers();
  OmniGenAudioModelsResponse {
    success: true,
    models,
    providers,
  }
});

fn build_omni_gen_audio_models() -> Vec<OmniGenAudioModelDetails> {
  let mut models = Vec::new();

  // Suno Music: full songs from a text prompt with optional style direction.
  models.push(OmniGenAudioModelDetails {
    model: CommonAudioModel::SunoMusic,
    model_creator: Some(ModelCreator::Suno),
    full_name: Some("Suno Music".to_string()),
    text_prompt_supported: Some(true),
    style_prompt_supported: Some(true),
    instrumental_toggle_supported: Some(true),
    ..Default::default()
  });

  // Suno Remix: remix an existing track (exactly one audio reference).
  models.push(OmniGenAudioModelDetails {
    model: CommonAudioModel::SunoRemix,
    model_creator: Some(ModelCreator::Suno),
    full_name: Some("Suno Remix".to_string()),
    text_prompt_supported: Some(true),
    style_prompt_supported: Some(true),
    keep_lyrics_supported: Some(true),
    audio_references_supported: Some(true),
    audio_references_max: Some(1),
    ..Default::default()
  });

  // Suno Sounds: sound effects with loop, BPM, and musical key controls.
  models.push(OmniGenAudioModelDetails {
    model: CommonAudioModel::SunoSounds,
    model_creator: Some(ModelCreator::Suno),
    full_name: Some("Suno Sounds".to_string()),
    text_prompt_supported: Some(true),
    loopable_toggle_supported: Some(true),
    bpm_supported: Some(true),
    musical_key_supported: Some(true),
    ..Default::default()
  });

  // Suno Sample: build a song from a sample (exactly one audio reference).
  models.push(OmniGenAudioModelDetails {
    model: CommonAudioModel::SunoSample,
    model_creator: Some(ModelCreator::Suno),
    full_name: Some("Suno Sample".to_string()),
    text_prompt_supported: Some(true),
    style_prompt_supported: Some(true),
    instrumental_toggle_supported: Some(true),
    audio_references_supported: Some(true),
    audio_references_max: Some(1),
    ..Default::default()
  });

  // Seed Audio 1.0 (ByteDance): sound generation with audio/image references
  // and output shaping controls.
  models.push(OmniGenAudioModelDetails {
    model: CommonAudioModel::SeedAudio1p0,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seed Audio 1.0".to_string()),
    text_prompt_supported: Some(true),
    audio_references_supported: Some(true),
    audio_references_max: Some(3),
    image_references_supported: Some(true),
    image_references_max: Some(1),
    sample_rate_hz_options: Some(vec![8000, 16000, 24000, 32000, 44100, 48000]),
    sample_rate_hz_default: Some(24000),
    speed_supported: Some(true),
    volume_supported: Some(true),
    pitch_supported: Some(true),
    ..Default::default()
  });

  models
}

fn build_omni_gen_audio_model_providers() -> Vec<OmniGenAudioModelProviderDetails> {
  let mut providers = Vec::new();

  providers.push(OmniGenAudioModelProviderDetails {
    provider: GenerationProvider::Artcraft,
    models: vec![
      OmniGenAudioProviderModelDetails {
        model: CommonAudioModel::SunoMusic,
        overrides: None,
      },
      OmniGenAudioProviderModelDetails {
        model: CommonAudioModel::SunoRemix,
        overrides: None,
      },
      OmniGenAudioProviderModelDetails {
        model: CommonAudioModel::SunoSounds,
        overrides: None,
      },
      OmniGenAudioProviderModelDetails {
        model: CommonAudioModel::SunoSample,
        overrides: None,
      },
      OmniGenAudioProviderModelDetails {
        model: CommonAudioModel::SeedAudio1p0,
        overrides: None,
      },
    ],
  });

  providers
}
