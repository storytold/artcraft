use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const REMOVE_IMAGE_BACKGROUND_PATH: &str = "/v1/generate/image/remove_background";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct RemoveImageBackgroundRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,
  
  /// Source of the file to remove the background from.
  /// It must be an image.
  pub media_file_token: Option<MediaFileToken>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct RemoveImageBackgroundResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}
