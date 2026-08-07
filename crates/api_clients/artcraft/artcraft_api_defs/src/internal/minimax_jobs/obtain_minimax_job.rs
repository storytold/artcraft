use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::internal::minimax_jobs::minimax_worker_model::MinimaxWorkerModel;

/// Request body for `POST /v1/internal/minimax_jobs/obtain_job`.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct ObtainMinimaxJobRequest {
  /// Which model the worker wants a job for.
  pub model: MinimaxWorkerModel,

  /// The worker's hostname (linux hostname, k8s pod name).
  pub worker_hostname: String,

  /// The cluster the worker runs in (e.g. "runpod", "lambda").
  pub cluster_name: String,
}

/// Response body for `POST /v1/internal/minimax_jobs/obtain_job`.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct ObtainMinimaxJobResponse {
  pub success: bool,

  /// The obtained job, or `None` when no pending job is available.
  pub maybe_job: Option<ObtainedMinimaxJob>,
}

/// A job the worker now holds a lock on (status was moved to `started`).
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct ObtainedMinimaxJob {
  pub job_token: InferenceJobToken,

  /// Echo of the requested model.
  pub model: MinimaxWorkerModel,
}
