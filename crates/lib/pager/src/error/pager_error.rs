use std::error::Error;
use std::fmt::{Display, Formatter};

use crate::error::pager_client_error::PagerClientError;
use crate::error::pager_service_error::PagerServiceError;

/// Top-level error type for the pager library.
#[derive(Debug)]
pub enum PagerError {
  Client(PagerClientError),
  Service(PagerServiceError),
}

impl Error for PagerError {}

impl Display for PagerError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(err) => write!(f, "PagerClientError: {}", err),
      Self::Service(err) => write!(f, "PagerServiceError: {}", err),
    }
  }
}

impl From<PagerClientError> for PagerError {
  fn from(err: PagerClientError) -> Self {
    Self::Client(err)
  }
}

impl From<PagerServiceError> for PagerError {
  fn from(err: PagerServiceError) -> Self {
    Self::Service(err)
  }
}
