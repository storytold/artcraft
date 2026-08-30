use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;

/// Request body for `POST /v1/internal/minimax_jobs/job/{job_token}/failure`.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct MarkMinimaxJobFailureRequest {
  /// Optional failure class the frontend can localize and present.
  pub maybe_frontend_failure_category: Option<FrontendFailureCategory>,

  /// Optional failure reason we can show the user (512 characters max).
  pub maybe_user_failure_reason: Option<String>,

  /// Optional internal-only stack trace or error (512 characters max).
  pub maybe_internal_debugging_failure_reason: Option<String>,

  /// Optional total wall-clock runtime of the failed attempt, in milliseconds.
  pub execution_duration_millis: Option<u64>,

  /// Optional inference-only runtime of the failed attempt, in milliseconds.
  pub inference_duration_millis: Option<u64>,
}

/// Response body for `POST /v1/internal/minimax_jobs/job/{job_token}/failure`.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct MarkMinimaxJobFailureResponse {
  pub success: bool,
}
