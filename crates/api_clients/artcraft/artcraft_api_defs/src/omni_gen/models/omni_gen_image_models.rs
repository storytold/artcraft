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
#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenImageModelsResponse {
  pub success: bool,
  pub providers: Vec<OmniGenImageProviderModels>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenImageProviderModels {
  pub provider: GenerationProvider,
  pub models: Vec<OmniGenImageModelDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenImageModelDetails {
  pub model: CommonImageModel,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub full_name: Option<String>,

  // TODO: model_creator: ModelCreator,

  // TODO: Types of UI to show up in (list or bools)
  //  eg. can use in image editing UI, 3d editor, etc.

  // TODO: sub-features like inpainting masking,
  // TODO: angle edit models

  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_prompt_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_prompt_max_length: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_text_prompt_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_text_prompt_max_length: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_refs_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_refs_max: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub has_fixed_editing_aspect_ratio: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio_options: Option<Vec<CommonAspectRatio>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio_default: Option<CommonAspectRatio>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio_default_when_editing: Option<CommonAspectRatio>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution_options: Option<Vec<CommonResolution>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution_default: Option<CommonResolution>,

  pub quality_options: Option<Vec<CommonQuality>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub default_quality: Option<CommonQuality>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub batch_size_min: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub batch_size_max: Option<u16>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub batch_size_options: Option<Vec<u16>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub batch_size_default: Option<u16>,
}

impl Default for OmniGenImageModelDetails {
  fn default() -> Self {
    Self {
      model: CommonImageModel::NanaBananaPro,
      ..Default::default()
    }
  }
}
