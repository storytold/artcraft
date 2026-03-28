use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_image_model::CommonImageModel;
use enums::common::generation::common_quality::CommonQuality;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation_provider::GenerationProvider;
use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

/// Query string parameters for the image models endpoint.
#[derive(Deserialize, IntoParams, ToSchema)]
pub struct OmniGenImageModelsQuery {
  /// Which provider's models to list. Defaults to "artcraft" if absent.
  pub provider: Option<OmniGenImageModelsProvider>,
}

/// The provider filter for the models endpoint.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum OmniGenImageModelsProvider {
  /// Only models available through ArtCraft.
  Artcraft,
  /// All known models across all providers.
  All,
}

impl Default for OmniGenImageModelsProvider {
  fn default() -> Self {
    Self::Artcraft
  }
}

/// Response body for the image models endpoint.
/// TBD — fields will be added later.
#[derive(Serialize, ToSchema)]
pub struct OmniGenImageModelsResponse {
  pub success: bool,
}

#[derive(Serialize, ToSchema)]
pub struct OmniGenImageProviderModels {
  pub provider: GenerationProvider,
  pub models: Vec<OmniGenImageModelDetails>,
}

#[derive(Serialize, ToSchema)]
pub struct OmniGenImageModelDetails {
  pub model: CommonImageModel,

  pub full_name: Option<String>,

  // TODO: model_creator: ModelCreator,

  // TODO: Types of UI to show up in (list or bools)
  //  eg. can use in image editing UI, 3d editor, etc.

  // TODO: sub-features like inpainting masking,
  // TODO: angle edit models

  pub text_prompt_supported: Option<bool>,
  pub text_prompt_max_length: Option<u16>,

  pub negative_text_prompt_supported: Option<bool>,
  pub negative_text_prompt_max_length: Option<u16>,

  pub image_refs_supported: Option<bool>,
  pub image_refs_max: Option<u16>,

  pub has_fixed_editing_aspect_ratio: Option<bool>,

  pub aspect_ratio_options: Option<Vec<CommonAspectRatio>>,
  pub aspect_ratio_default: Option<CommonAspectRatio>,

  pub resolution_options: Option<Vec<CommonResolution>>,
  pub resolution_default: Option<CommonResolution>,

  pub quality_options: Option<Vec<CommonQuality>>,
  pub default_quality: Option<CommonQuality>,

  pub batch_size_min: Option<u16>,
  pub batch_size_max: Option<u16>,
  pub batch_size_options: Option<Vec<u16>>,
  pub batch_size_default: Option<u16>,
}
