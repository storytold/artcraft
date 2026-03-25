use std::error::Error;
use std::fmt::{Display, Formatter};

/// Errors from our own pager system at runtime (concurrency, queue, etc.).
#[derive(Debug)]
pub enum PagerSystemError {
  /// The message queue was not configured. Use `build_with_worker()` to enable queuing.
  QueueNotConfigured,

  /// A mutex lock was poisoned (another thread panicked while holding it).
  MutexPoisoned(String),
}

impl Error for PagerSystemError {}

impl Display for PagerSystemError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::QueueNotConfigured => write!(f, "Pager message queue not configured. Use build_with_worker() to enable queuing."),
      Self::MutexPoisoned(msg) => write!(f, "Pager mutex poisoned: {}", msg),
    }
  }
}
