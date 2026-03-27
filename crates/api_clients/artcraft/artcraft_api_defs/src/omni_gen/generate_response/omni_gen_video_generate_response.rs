use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use utoipa::ToSchema;

/// Response body for the omni-gen video generation endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct OmniGenVideoGenerateResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}
