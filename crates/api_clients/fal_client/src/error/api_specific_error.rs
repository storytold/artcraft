use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum FalSpecificApiError {
  /// The job is still in progress. The response URL is not ready yet.
  /// Contains the detail message from the FAL API (e.g. "Request is still in progress").
  IncompleteJob(String),
}

impl Error for FalSpecificApiError {}

impl Display for FalSpecificApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::IncompleteJob(detail) => write!(f, "Job is incomplete: {}", detail),
    }
  }
}
