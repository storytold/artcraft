//! The JSON fal sends back right after a job is submitted to the queue.

use serde::{Deserialize, Serialize};

/// Receipt for a queued job. Save `request_id`: it is what we poll with later.
#[derive(Debug, Serialize, Deserialize)]
pub struct QueueResponse {
  /// fal's id for the job.
  pub request_id: String,
  /// URL to GET for the finished result.
  pub response_url: String,
  /// URL to GET for the job's current status.
  pub status_url: String,
  /// URL to PUT to cancel the job.
  pub cancel_url: String,
}
