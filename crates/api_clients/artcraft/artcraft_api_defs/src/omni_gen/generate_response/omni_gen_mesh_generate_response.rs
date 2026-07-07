use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use utoipa::ToSchema;

/// Response body for the omni-gen mesh generation endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct OmniGenMeshGenerateResponse {
  pub success: bool,

  pub inference_job_token: InferenceJobToken,

  /// All job tokens created by this request (including the primary).
  /// For single-job requests this will contain just one element matching
  /// `inference_job_token`. For batch requests this will contain all of them.
  pub all_job_tokens: Vec<InferenceJobToken>,
}
