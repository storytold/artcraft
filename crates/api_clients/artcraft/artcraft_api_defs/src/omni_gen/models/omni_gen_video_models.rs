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
#[derive(Serialize, ToSchema)]
pub struct OmniGenVideoModelsResponse {
  pub success: bool,
  pub providers: OmniGenVideoProviderModels,
}

#[derive(Serialize, ToSchema)]
pub struct OmniGenVideoProviderModels {
  pub provider: GenerationProvider,
  pub models: Vec<OmniGenVideoModelDetails>,
}

#[derive(Serialize, ToSchema)]
pub struct OmniGenVideoModelDetails {

  pub model: CommonVideoModel,
  pub full_name: Option<String>,
  // TODO: model_creator: ModelCreator,

  pub text_prompt_supported: Option<bool>,
  pub text_prompt_max_length: Option<u16>,
  
  pub negative_text_prompt_supported: Option<bool>,
  pub negative_text_prompt_max_length: Option<u16>,

  pub starting_keyframe_supported: Option<bool>,
  pub starting_keyframe_required: Option<bool>,

  pub ending_keyframe_supported: Option<bool>,

  pub image_references_supported: Option<bool>,
  pub image_references_max: Option<u16>,

  pub video_references_supported: Option<bool>,
  pub video_references_max: Option<u16>,
  pub video_reference_max_total_duration_seconds: Option<u16>,

  pub audio_references_supported: Option<bool>,
  pub audio_references_max: Option<u16>,
  pub audio_reference_max_total_duration_seconds: Option<u16>,

  pub show_generate_with_sound_toggle: Option<bool>,

  pub aspect_ratio_options: Option<Vec<CommonAspectRatio>>,
  pub aspect_ratio_default: Option<CommonAspectRatio>,

  pub resolution_options: Option<Vec<CommonResolution>>,
  pub resolution_default: Option<CommonResolution>,

  pub quality_options: Option<Vec<CommonQuality>>,
  pub default_quality: Option<CommonQuality>,

  pub duration_seconds_min: Option<u16>,
  pub duration_seconds_max: Option<u16>,
  pub duration_seconds_options: Option<Vec<u16>>,
  pub duration_seconds_default: Option<u16>,
  
  pub batch_size_min: Option<u16>,
  pub batch_size_max: Option<u16>,
  pub batch_size_options: Option<Vec<u16>>,
  pub batch_size_default: Option<u16>,
}
