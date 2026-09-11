use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

pub const UPLOAD_UPDATED_SCENE_3D_PROJECT_URL_PATH: &str = "/v1/media_files/upload/project/scene_3d/update/{token}";

/// For the URL PathInfo
#[derive(Serialize, Deserialize, ToSchema)]
pub struct UploadUpdatedScene3dProjectPathInfo {
  pub token: MediaFileToken,
}

/// Response for overwriting an existing 3D scene project.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct UploadUpdatedScene3dProjectSuccessResponse {
  pub success: bool,

  /// Token of the updated project media file (unchanged by the update).
  pub media_file_token: MediaFileToken,
}
