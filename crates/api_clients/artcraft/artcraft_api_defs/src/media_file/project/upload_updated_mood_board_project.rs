use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

pub const UPLOAD_UPDATED_MOOD_BOARD_PROJECT_URL_PATH: &str = "/v1/media_files/upload/project/mood_board/update/{token}";

/// For the URL PathInfo
#[derive(Serialize, Deserialize, ToSchema)]
pub struct UploadUpdatedMoodBoardProjectPathInfo {
  pub token: MediaFileToken,
}

/// Response for overwriting an existing mood board project.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct UploadUpdatedMoodBoardProjectSuccessResponse {
  pub success: bool,

  /// Token of the updated project media file (unchanged by the update).
  pub media_file_token: MediaFileToken,
}
