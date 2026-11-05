//! The JSON fal sends when we ask for a result too early. `poll_job_response` turns it into
//! `FalSpecificApiError::IncompleteJob`.

use serde::Deserialize;

/// Raw JSON response returned by the FAL queue response endpoint
/// when the job is still in progress (HTTP 400).
#[derive(Debug, Deserialize)]
pub struct RawIncompleteJobResponse {
  /// Human-readable explanation, e.g. "Request is still in progress".
  pub detail: Option<String>,
  /// fal's id for the job.
  pub request_id: Option<String>,
  /// URL where the result will appear when ready.
  pub response_url: Option<String>,
  /// URL to poll for status.
  pub status_url: Option<String>,
  /// URL to cancel the job.
  pub cancel_url: Option<String>,
}
