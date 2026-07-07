use enums::common::generation::common_splat_model::CommonSplatModel;
use enums::common::generation::model_creator::ModelCreator;
use enums::common::generation_provider::GenerationProvider;
use serde_derive::Serialize;
use utoipa::ToSchema;

/// Splat model to default to if none is specified
const DEFAULT_SPLAT_MODEL : CommonSplatModel = CommonSplatModel::Marble1p1;

/// Response body for the splat models endpoint.
#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenSplatModelsResponse {
  pub success: bool,

  /// A list of all models: details, features, and capabilities
  pub models: Vec<OmniGenSplatModelDetails>,

  /// Provider-by-provider model offering and capability list,
  /// with possible capability overrides (future)
  pub providers: Vec<OmniGenSplatModelProviderDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenSplatModelProviderDetails {
  pub provider: GenerationProvider,
  pub models: Vec<OmniGenSplatProviderModelDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenSplatProviderModelDetails {
  pub model: CommonSplatModel,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub overrides: Option<OmniGenSplatModelDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenSplatModelDetails {

  pub model: CommonSplatModel,

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

  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_references_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_references_max: Option<u16>,

  /// Whether a reference video input is supported.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub video_reference_supported: Option<bool>,

  /// Whether a 360-degree panorama reference image is supported.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub panorama_supported: Option<bool>,

  /// Whether the "disable recaption" toggle is supported.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub disable_recaption_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub is_disabled: Option<bool>,
}

impl Default for OmniGenSplatModelDetails {
  fn default() -> Self {
    Self {
      model: DEFAULT_SPLAT_MODEL,
      model_creator: None,
      full_name: None,
      extra_info: None,
      extra_info_short: None,
      text_prompt_supported: None,
      image_references_supported: None,
      image_references_max: None,
      video_reference_supported: None,
      panorama_supported: None,
      disable_recaption_supported: None,
      is_disabled: None,
    }
  }
}
