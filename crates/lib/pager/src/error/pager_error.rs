use std::error::Error;
use std::fmt::{Display, Formatter};

use crate::error::pager_service_error::PagerServiceError;
use crate::error::pager_system_error::PagerSystemError;

/// Top-level error type for the pager library.
#[derive(Debug)]
pub enum PagerError {
  /// A third-party paging service (Rootly, etc.) returned an error.
  Service(PagerServiceError),

  /// Our own pager system broke (mutex, queue, etc.).
  System(PagerSystemError),
}

impl Error for PagerError {}

impl Display for PagerError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Service(err) => write!(f, "PagerServiceError: {}", err),
      Self::System(err) => write!(f, "PagerSystemError: {}", err),
    }
  }
}

impl From<PagerServiceError> for PagerError {
  fn from(err: PagerServiceError) -> Self {
    Self::Service(err)
  }
}

impl From<PagerSystemError> for PagerError {
  fn from(err: PagerSystemError) -> Self {
    Self::System(err)
  }
}
