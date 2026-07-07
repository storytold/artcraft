use enums::common::generation::common_audio_model::CommonAudioModel;
use enums::common::generation::model_creator::ModelCreator;
use enums::common::generation_provider::GenerationProvider;
use serde_derive::Serialize;
use utoipa::ToSchema;

/// Audio model to default to if none is specified
const DEFAULT_AUDIO_MODEL : CommonAudioModel = CommonAudioModel::SunoMusic;

/// Response body for the audio models endpoint.
#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenAudioModelsResponse {
  pub success: bool,

  /// A list of all models: details, features, and capabilities
  pub models: Vec<OmniGenAudioModelDetails>,

  /// Provider-by-provider model offering and capability list,
  /// with possible capability overrides (future)
  pub providers: Vec<OmniGenAudioModelProviderDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenAudioModelProviderDetails {
  pub provider: GenerationProvider,
  pub models: Vec<OmniGenAudioProviderModelDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenAudioProviderModelDetails {
  pub model: CommonAudioModel,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub overrides: Option<OmniGenAudioModelDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenAudioModelDetails {

  pub model: CommonAudioModel,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub model_creator: Option<ModelCreator>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub full_name: Option<String>,

  /// Additional details about the model.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub extra_info: Option<String>,

  /// Additional details about the model. (Brief; only a few words.)
  #[serde(skip_serializing_if = "Option::is_none")]
  pub extra_info_short: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_prompt_supported: Option<bool>,

  /// Whether a style/genre prompt (Suno's "tags") is supported.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub style_prompt_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub audio_references_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub audio_references_max: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_references_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_references_max: Option<u16>,

  /// Whether the "keep lyrics" toggle is supported (Suno Remix).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub keep_lyrics_supported: Option<bool>,

  /// Whether the instrumental-only toggle is supported (Suno Music / Sample).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub instrumental_toggle_supported: Option<bool>,

  /// Whether the loop vs single-hit toggle is supported (Suno Sounds).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub loopable_toggle_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub bpm_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub musical_key_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub sample_rate_hz_options: Option<Vec<u32>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub sample_rate_hz_default: Option<u32>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub speed_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub volume_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub pitch_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub is_disabled: Option<bool>,
}

impl Default for OmniGenAudioModelDetails {
  fn default() -> Self {
    Self {
      model: DEFAULT_AUDIO_MODEL,
      model_creator: None,
      full_name: None,
      extra_info: None,
      extra_info_short: None,
      text_prompt_supported: None,
      style_prompt_supported: None,
      audio_references_supported: None,
      audio_references_max: None,
      image_references_supported: None,
      image_references_max: None,
      keep_lyrics_supported: None,
      instrumental_toggle_supported: None,
      loopable_toggle_supported: None,
      bpm_supported: None,
      musical_key_supported: None,
      sample_rate_hz_options: None,
      sample_rate_hz_default: None,
      speed_supported: None,
      volume_supported: None,
      pitch_supported: None,
      is_disabled: None,
    }
  }
}
