use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

pub const UPDATE_VIDEO_TIMELINE_PROJECT_URL_PATH: &str = "/v1/media_files/upload/project/video_timeline/update/{token}";

/// For the URL PathInfo
#[derive(Serialize, Deserialize, ToSchema)]
pub struct UpdateVideoTimelineProjectPathInfo {
  pub token: MediaFileToken,
}

/// Response for overwriting an existing video editor timeline project.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct UpdateVideoTimelineProjectSuccessResponse {
  pub success: bool,

  /// Token of the updated project media file (unchanged by the update).
  pub media_file_token: MediaFileToken,
}
