use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

pub const UPLOAD_NEW_EDITOR_2D_PROJECT_URL_PATH: &str = "/v1/media_files/upload/project/editor_2d/new";

/// Response for saving a new 2D editor document project.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct UploadNewEditor2dProjectSuccessResponse {
  pub success: bool,

  /// Token for the newly created project media file. Use it to query the
  /// project and to save subsequent updates via the update endpoint.
  pub media_file_token: MediaFileToken,
}
