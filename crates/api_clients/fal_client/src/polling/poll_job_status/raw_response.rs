use serde::Deserialize;

/// Raw JSON response from the FAL queue status endpoint.
///
/// See: https://fal.ai/docs/documentation/model-apis/inference/queue
#[derive(Debug, Deserialize)]
pub struct RawPollJobStatusResponse {
  pub status: String,
  pub request_id: Option<String>,
  pub response_url: Option<String>,
  pub status_url: Option<String>,
  pub cancel_url: Option<String>,
  pub queue_position: Option<u64>,
  pub logs: Option<Vec<RawPollJobStatusLog>>,
  pub metrics: Option<RawPollJobStatusMetrics>,
}

#[derive(Debug, Deserialize)]
pub struct RawPollJobStatusLog {
  pub message: Option<String>,
  pub level: Option<String>,
  pub source: Option<String>,
  pub timestamp: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RawPollJobStatusMetrics {
  pub inference_time: Option<f64>,
}
