use enums::common::generation::common_mesh_model::CommonMeshModel;
use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
use enums::common::generation::common_polygon_type::CommonPolygonType;
use enums::common::generation::model_creator::ModelCreator;
use enums::common::generation_provider::GenerationProvider;
use serde_derive::Serialize;
use utoipa::ToSchema;

/// Mesh model to default to if none is specified
const DEFAULT_MESH_MODEL : CommonMeshModel = CommonMeshModel::Hunyuan3d3;

/// Response body for the mesh models endpoint.
#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenMeshModelsResponse {
  pub success: bool,

  /// A list of all models: details, features, and capabilities
  pub models: Vec<OmniGenMeshModelDetails>,

  /// Provider-by-provider model offering and capability list,
  /// with possible capability overrides (future)
  pub providers: Vec<OmniGenMeshModelProviderDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenMeshModelProviderDetails {
  pub provider: GenerationProvider,
  pub models: Vec<OmniGenMeshProviderModelDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenMeshProviderModelDetails {
  pub model: CommonMeshModel,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub overrides: Option<OmniGenMeshModelDetails>,
}

#[derive(Serialize, ToSchema, Clone)]
pub struct OmniGenMeshModelDetails {

  pub model: CommonMeshModel,

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

  /// Whether text-to-3D prompting is supported.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_prompt_supported: Option<bool>,

  /// Whether image-to-3D input is supported.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_input_supported: Option<bool>,

  /// Whether sketch-to-3D input is supported.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub sketch_input_supported: Option<bool>,

  /// Whether multi-view (front/back/left/right) image input is supported.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub multi_view_supported: Option<bool>,

  /// The mesh output types the model supports.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub mesh_output_types: Option<Vec<CommonMeshOutputType>>,

  /// The polygon types the model supports.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub polygon_types: Option<Vec<CommonPolygonType>>,

  /// Whether a target face count can be specified.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub face_count_supported: Option<bool>,

  /// Whether PBR (physically based rendering) material generation is supported.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub pbr_supported: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub is_disabled: Option<bool>,
}

impl Default for OmniGenMeshModelDetails {
  fn default() -> Self {
    Self {
      model: DEFAULT_MESH_MODEL,
      model_creator: None,
      full_name: None,
      extra_info: None,
      extra_info_short: None,
      text_prompt_supported: None,
      image_input_supported: None,
      sketch_input_supported: None,
      multi_view_supported: None,
      mesh_output_types: None,
      polygon_types: None,
      face_count_supported: None,
      pbr_supported: None,
      is_disabled: None,
    }
  }
}
