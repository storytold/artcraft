use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const HUNYUAN3D_V3_MULTI_FUNCTION_OBJECT_GEN_PATH: &str = "/v1/generate/object/multi_function/hunyuan3d_v3";

/// Hunyuan 3D v3 Multi-Function Request
///
/// This endpoint combines three modes:
/// - Text-to-3D: Provide only a prompt (no image_media_token)
/// - Image-to-3D: Provide an image_media_token (no prompt or empty prompt)
/// - Sketch-to-3D: Provide both a prompt AND an image_media_token
#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct Hunyuan3dV3MultiFunctionObjectGenRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt for generation.
  /// - Required for text-to-3d mode
  /// - Required for sketch-to-3d mode
  /// - Ignored for image-to-3d mode
  pub prompt: Option<String>,

  /// Primary image media token.
  /// - Required for image-to-3d mode
  /// - Required for sketch-to-3d mode
  /// - Not used for text-to-3d mode
  pub image_media_token: Option<MediaFileToken>,

  /// Back view image for multi-view image-to-3d mode.
  /// Only applicable when image_media_token is provided without a prompt.
  pub back_image_media_token: Option<MediaFileToken>,

  /// Left view image for multi-view image-to-3d mode.
  /// Only applicable when image_media_token is provided without a prompt.
  pub left_image_media_token: Option<MediaFileToken>,

  /// Right view image for multi-view image-to-3d mode.
  /// Only applicable when image_media_token is provided without a prompt.
  pub right_image_media_token: Option<MediaFileToken>,

  /// Target face count for the generated mesh.
  /// Optional - if not provided, the model will use its default.
  pub face_count: Option<u32>,

  /// Type of generation to perform.
  /// Default is Normal.
  pub generate_type: Option<Hunyuan3dV3GenerateType>,

  /// Type of polygon to use in the generated mesh.
  /// Default is Triangle.
  pub polygon_type: Option<Hunyuan3dV3PolygonType>,

  /// Whether to enable PBR (Physically Based Rendering) materials.
  /// Default is false.
  pub enable_pbr: Option<bool>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Hunyuan3dV3GenerateType {
  /// Standard generation quality (default)
  Normal,
  /// Low polygon count for game assets
  LowPoly,
  /// Geometry only, no textures
  Geometry,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Hunyuan3dV3PolygonType {
  /// Triangle polygons (default)
  Triangle,
  /// Quadrilateral polygons
  Quadrilateral,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct Hunyuan3dV3MultiFunctionObjectGenResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}
