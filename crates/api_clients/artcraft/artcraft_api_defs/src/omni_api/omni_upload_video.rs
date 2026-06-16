use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

/// Success response for the API-key authenticated video upload endpoint
/// (`POST /v1/omni_api/upload/video`).
///
/// NB: The request is a `multipart/form-data` body. Because the multipart form type is bound to the
/// web framework, it is declared alongside the handler in `storyteller_web` rather than here.
#[derive(Clone, Serialize, Deserialize, ToSchema, Debug)]
pub struct OmniUploadVideoMediaFileSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}
