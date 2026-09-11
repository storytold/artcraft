use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

pub const UPLOAD_UPDATED_EDITOR_2D_PROJECT_URL_PATH: &str = "/v1/media_files/upload/project/editor_2d/update/{token}";

/// For the URL PathInfo
#[derive(Serialize, Deserialize, ToSchema)]
pub struct UploadUpdatedEditor2dProjectPathInfo {
  pub token: MediaFileToken,
}

/// Response for overwriting an existing 2D editor project.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct UploadUpdatedEditor2dProjectSuccessResponse {
  pub success: bool,

  /// Token of the updated project media file (unchanged by the update).
  pub media_file_token: MediaFileToken,
}
