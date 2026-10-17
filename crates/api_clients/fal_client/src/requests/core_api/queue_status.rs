//! The JSON fal returns when we ask how a queued job is doing (`Queue::status`).

use serde::{Deserialize, Serialize};

/// Where a queued job is in its life. fal spells these "IN_QUEUE", "IN_PROGRESS",
/// "COMPLETED" on the wire, hence the SCREAMING_SNAKE_CASE rename.
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Status {
  /// Waiting for a worker to pick it up.
  InQueue,
  /// A worker is running the model.
  InProgress,
  /// Finished; the result can be fetched from `response_url`.
  Completed,
}

/// One log line the model printed while running.
#[derive(Debug, Serialize, Deserialize)]
pub struct RequestLog {
  /// When the line was logged (as fal formats it; not parsed here).
  pub timestamp: String,
  /// Severity such as "INFO", if fal supplies one.
  pub level: Option<String>,
  /// Which part of fal produced the line, if supplied.
  pub source: Option<String>,
  /// The log text.
  pub message: String,
}

/// Snapshot of a queued job returned by the status URL.
#[derive(Debug, Serialize, Deserialize)]
pub struct QueueStatus {
  /// The status of the Queue request
  pub status: Status,
  /// The position of the request in the queue
  pub queue_position: Option<i64>,
  /// The URL of the response
  pub response_url: String,
  /// The logs of the request, if `show_logs` is `true`
  pub logs: Option<Vec<RequestLog>>,
}
