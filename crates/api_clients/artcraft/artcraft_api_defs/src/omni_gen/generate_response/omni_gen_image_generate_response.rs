use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use utoipa::ToSchema;

/// Response body for the omni-gen image generation endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct OmniGenImageGenerateResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}
