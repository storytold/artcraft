use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::common::generation::common_mesh_model::CommonMeshModel;
use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
use enums::common::generation::common_mesh_quality::CommonMeshQuality;
use enums::common::generation::common_polygon_type::CommonPolygonType;
use tokens::tokens::media_files::MediaFileToken;

/// Shared request body for both the mesh cost estimate and mesh generation endpoints.
#[derive(Clone, Serialize, Deserialize, ToSchema, Debug)]
pub struct OmniGenMeshCostAndGenerateRequest {
  /// REQUIRED (even if marked optional)
  /// Idempotency token to prevent duplicate requests.
  pub idempotency_token: Option<String>,

  /// REQUIRED (even if marked optional)
  /// Which model to use.
  pub model: Option<CommonMeshModel>,

  /// The text prompt for the mesh generation (text-to-3D).
  pub prompt: Option<String>,

  /// Reference images (optional).
  /// The primary/front input image, or the sketch image for sketch-to-3D.
  pub reference_image_media_tokens: Option<Vec<MediaFileToken>>,

  /// Front view image (optional; multi-view input).
  /// Can be used instead of `reference_image_media_tokens[0]` when the other
  /// side views are supplied.
  pub front_image_media_token: Option<MediaFileToken>,

  /// Back view image (optional; multi-view input).
  pub back_image_media_token: Option<MediaFileToken>,

  /// Left view image (optional; multi-view input).
  pub left_image_media_token: Option<MediaFileToken>,

  /// Right view image (optional; multi-view input).
  pub right_image_media_token: Option<MediaFileToken>,

  /// Input mesh file for mesh-to-mesh models (part splitting, retopology).
  /// Required by `hunyuan_3d_3p1_part` (FBX) and
  /// `hunyuan_3d_3p1_topology` (GLB/OBJ).
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub input_mesh_media_token: Option<MediaFileToken>,

  /// The mesh output type to generate (normal, low-poly, or geometry-only).
  pub mesh_output_type: Option<CommonMeshOutputType>,

  /// The polygon type to use for the generated mesh (triangle or quad).
  pub polygon_type: Option<CommonPolygonType>,

  /// Target face count for the generated mesh.
  pub face_count: Option<u64>,

  /// Whether to generate PBR (physically based rendering) materials.
  pub enable_pbr: Option<bool>,

  /// Whether to generate textures. Some models (Tripo3D) can skip texturing
  /// for a cheaper, faster generation.
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub enable_texture: Option<bool>,

  /// Texture quality. `Detailed` costs extra on some models (Tripo3D's HD
  /// texture tier).
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub texture_quality: Option<CommonMeshQuality>,

  /// Geometry quality. `Detailed` costs extra on some models (Tripo3D).
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub geometry_quality: Option<CommonMeshQuality>,
}
