use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Status {
  InQueue,
  InProgress,
  Completed,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestLog {
  pub timestamp: String,
  pub level: Option<String>,
  pub source: Option<String>,
  pub message: String,
}

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
