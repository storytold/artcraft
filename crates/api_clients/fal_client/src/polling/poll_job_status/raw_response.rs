//! The exact JSON shape of fal's status reply. `poll_job_status` converts it into the
//! friendlier `PollJobStatusResponse`.

use serde::Deserialize;

/// Raw JSON response from the FAL queue status endpoint.
///
/// See: https://fal.ai/docs/documentation/model-apis/inference/queue
#[derive(Debug, Deserialize)]
pub struct RawPollJobStatusResponse {
  /// "IN_QUEUE", "IN_PROGRESS" or "COMPLETED".
  pub status: String,
  /// fal's id for the job.
  pub request_id: Option<String>,
  /// URL to fetch the finished result from.
  pub response_url: Option<String>,
  /// URL to poll for status (the one we just called).
  pub status_url: Option<String>,
  /// URL to cancel the job.
  pub cancel_url: Option<String>,
  /// Place in line; only sent while the job is still queued.
  pub queue_position: Option<u64>,
  /// Model log lines; `null` unless logs were requested.
  pub logs: Option<Vec<RawPollJobStatusLog>>,
  /// Timing numbers; `inference_time` appears once the job has finished.
  pub metrics: Option<RawPollJobStatusMetrics>,
}

/// One log line from the model run.
#[derive(Debug, Deserialize)]
pub struct RawPollJobStatusLog {
  /// The log text.
  pub message: Option<String>,
  /// Severity, e.g. "INFO".
  pub level: Option<String>,
  /// Which component produced the line.
  pub source: Option<String>,
  /// When it was logged, as fal formats it.
  pub timestamp: Option<String>,
}

/// Timing information fal attaches to a status reply.
#[derive(Debug, Deserialize)]
pub struct RawPollJobStatusMetrics {
  /// Seconds the model spent running (a float, e.g. 126.7).
  pub inference_time: Option<f64>,
}
