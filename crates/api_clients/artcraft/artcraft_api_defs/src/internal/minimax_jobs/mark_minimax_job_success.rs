use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

// NB: The success request is form-multipart (video bytes + optional
// `duration_millis` / `width` / `height` metadata fields), so its form struct
// lives with the actix handler; only the response shape is declared here.

/// Response body for `POST /v1/internal/minimax_jobs/job/{job_token}/success`.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct MarkMinimaxJobSuccessResponse {
  pub success: bool,

  /// The media file created from the uploaded video.
  pub media_file_token: MediaFileToken,
}
