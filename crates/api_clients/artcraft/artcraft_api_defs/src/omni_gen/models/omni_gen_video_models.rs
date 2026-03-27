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

  pub supports_text_prompt: Option<bool>,
  pub supports_negative_text_prompt: Option<bool>,

  pub supports_starting_keyframe: Option<bool>,
  pub requires_starting_keyframe: Option<bool>,

  pub supports_ending_keyframe: Option<bool>,

  pub supports_image_references: Option<bool>,
  pub max_image_references: Option<u16>,

  pub supports_video_references: Option<bool>,
  pub max_video_references: Option<u16>,
  pub max_video_reference_total_duration_seconds: Option<u16>,

  pub supports_audio_references: Option<bool>,
  pub max_audio_references: Option<u16>,
  pub max_audio_reference_total_duration_seconds: Option<u16>,

  pub supports_generate_with_sound_toggle: Option<bool>,

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
}
