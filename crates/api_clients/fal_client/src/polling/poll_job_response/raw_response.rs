use serde::Deserialize;

/// Raw JSON response returned by the FAL queue response endpoint
/// when the job is still in progress (HTTP 400).
#[derive(Debug, Deserialize)]
pub struct RawIncompleteJobResponse {
  pub detail: Option<String>,
  pub request_id: Option<String>,
  pub response_url: Option<String>,
  pub status_url: Option<String>,
  pub cancel_url: Option<String>,
}
