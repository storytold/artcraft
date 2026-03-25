use std::error::Error;
use std::fmt::{Display, Formatter};

/// Errors from our own pager system (configuration, concurrency, etc.).
#[derive(Debug)]
pub enum PagerSystemError {
  /// The pager was not configured with a backend.
  NoBackendConfigured,

  /// The pager was not configured with an application name.
  NoApplicationName,

  /// The message queue is full and the oldest item was dropped.
  QueueFull,

  /// A mutex lock was poisoned (another thread panicked while holding it).
  MutexPoisoned(String),
}

impl Error for PagerSystemError {}

impl Display for PagerSystemError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::NoBackendConfigured => write!(f, "No pager backend configured. Call .rootly() or .client_config() on PagerBuilder."),
      Self::NoApplicationName => write!(f, "No application name configured. Call .application_name() on PagerBuilder."),
      Self::QueueFull => write!(f, "Pager message queue is full."),
      Self::MutexPoisoned(msg) => write!(f, "Pager mutex poisoned: {}", msg),
    }
  }
}
