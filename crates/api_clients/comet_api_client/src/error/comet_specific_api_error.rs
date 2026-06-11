use std::error::Error;
use std::fmt::{Display, Formatter};

/// Server-side errors with specific, well-known causes.
#[derive(Debug)]
pub enum CometSpecificApiError {
  /// 401: the API key is missing or invalid.
  UnauthorizedInvalidApiKey { raw_body: String },

  /// The poll endpoint responded "task_not_exist" for the given task id.
  TaskNotFound { task_id: String, raw_body: String },
}

impl Error for CometSpecificApiError {}

impl Display for CometSpecificApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::UnauthorizedInvalidApiKey { raw_body } => write!(f, "Unauthorized: invalid or missing API key: {}", raw_body),
      Self::TaskNotFound { task_id, raw_body } => write!(f, "Task not found: {} ({})", task_id, raw_body),
    }
  }
}
