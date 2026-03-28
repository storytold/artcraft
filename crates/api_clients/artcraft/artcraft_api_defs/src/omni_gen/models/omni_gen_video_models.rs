use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_quality::CommonQuality;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation_provider::GenerationProvider;

/// Query string parameters for the video models endpoint.
#[derive(Deserialize, IntoParams, ToSchema)]
pub struct OmniGenVideoModelsQuery {
  /// Which provider's models to list. Defaults to "artcraft" if absent.
  pub provider: Option<OmniGenVideoModelsProvider>,
}

/// The provider filter for the models endpoint.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum OmniGenVideoModelsProvider {
  /// Only models available through ArtCraft.
  Artcraft,
  /// All known models across all providers.
  All,
}

impl Default for OmniGenVideoModelsProvider {
  fn default() -> Self {
    Self::Artcraft
  }
}

/// Response body for the video models endpoint.
/// TBD — fields will be added later.
#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenVideoModelsResponse {
  pub success: bool,
  
  /// A list of all models: details, features, and capabilities
  pub models: Vec<OmniGenVideoModelDetails>,
  
  /// Provider-by-provider model offering and capability list, 
  /// with possible capability overrides (future)
  pub providers: Vec<OmniGenVideoModelProviderDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenVideoModelProviderDetails {
  pub provider: GenerationProvider,
  pub models: Vec<OmniGenVideoProviderModelDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenVideoProviderModelDetails {
  pub model: CommonVideoModel,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub overrides: Option<OmniGenVideoModelDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenVideoModelDetails {

  pub model: CommonVideoModel,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub full_name: Option<String>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_prompt_supported: Option<bool>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_prompt_max_length: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_text_prompt_supported: Option<bool>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_text_prompt_max_length: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub starting_keyframe_supported: Option<bool>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub starting_keyframe_required: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub ending_keyframe_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_references_supported: Option<bool>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_references_max: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub video_references_supported: Option<bool>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub video_references_max: Option<u16>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub video_references_max_total_duration_seconds: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub audio_references_supported: Option<bool>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub audio_references_max: Option<u16>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub audio_references_max_total_duration_seconds: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub show_generate_with_sound_toggle: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio_options: Option<Vec<CommonAspectRatio>>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio_default: Option<CommonAspectRatio>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution_options: Option<Vec<CommonResolution>>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution_default: Option<CommonResolution>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality_options: Option<Vec<CommonQuality>>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub default_quality: Option<CommonQuality>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration_seconds_min: Option<u16>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration_seconds_max: Option<u16>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration_seconds_options: Option<Vec<u16>>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration_seconds_default: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub batch_size_min: Option<u16>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub batch_size_max: Option<u16>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub batch_size_options: Option<Vec<u16>>,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub batch_size_default: Option<u16>,
}

impl Default for OmniGenVideoModelDetails {
  fn default() -> Self {
    Self {
      model: CommonVideoModel::Seedance2p0,
      full_name: None,
      text_prompt_supported: None,
      text_prompt_max_length: None,
      negative_text_prompt_supported: None,
      negative_text_prompt_max_length: None,
      starting_keyframe_supported: None,
      starting_keyframe_required: None,
      ending_keyframe_supported: None,
      image_references_supported: None,
      image_references_max: None,
      video_references_supported: None,
      video_references_max: None,
      video_references_max_total_duration_seconds: None,
      audio_references_supported: None,
      audio_references_max: None,
      audio_references_max_total_duration_seconds: None,
      show_generate_with_sound_toggle: None,
      aspect_ratio_options: None,
      aspect_ratio_default: None,
      resolution_options: None,
      resolution_default: None,
      quality_options: None,
      default_quality: None,
      duration_seconds_min: None,
      duration_seconds_max: None,
      duration_seconds_options: None,
      duration_seconds_default: None,
      batch_size_min: None,
      batch_size_max: None,
      batch_size_options: None,
      batch_size_default: None,
    }
  }
}
