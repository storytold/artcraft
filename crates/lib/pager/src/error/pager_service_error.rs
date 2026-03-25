use std::error::Error;
use std::fmt::{Display, Formatter};

/// Errors from the pager service layer (worker, queue, etc.).
#[derive(Debug)]
pub enum PagerServiceError {
  /// The worker thread is not running or not configured.
  WorkerNotAvailable,

  /// The message queue is full and the oldest item was dropped.
  QueueFull { dropped_summary: String },
}

impl Error for PagerServiceError {}

impl Display for PagerServiceError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::WorkerNotAvailable => write!(f, "Pager worker thread is not available."),
      Self::QueueFull { dropped_summary } => {
        write!(f, "Pager queue is full. Dropped oldest item: {}", dropped_summary)
      }
    }
  }
}
