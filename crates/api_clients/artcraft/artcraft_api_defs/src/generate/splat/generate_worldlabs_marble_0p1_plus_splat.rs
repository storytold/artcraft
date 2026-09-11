use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const GENERATE_WORLDLABS_MARBLE_0P1_PLUS_SPLAT_URL_PATH: &str = "/v1/generate/splat/worldlabs_marble_0p1_plus";

/// World Labs Marble 0.1-plus Splat Generation
#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateWorldlabsMarble0p1PlusSplatRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Optional image to use as input for world generation.
  pub image_media_file_token: Option<MediaFileToken>,

  /// Optional text prompt for world generation.
  pub prompt: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateWorldlabsMarble0p1PlusSplatResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}
