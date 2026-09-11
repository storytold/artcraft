use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const GENERATE_HUNYUAN_2_0_IMAGE_TO_3D_URL_PATH: &str = "/v1/generate/object/hunyuan_2.0_image_to_3d";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateHunyuan20ImageTo3dRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Source of the file to convert to 3D
  /// It must be an image.
  pub media_file_token: Option<MediaFileToken>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateHunyuan20ImageTo3dResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}
