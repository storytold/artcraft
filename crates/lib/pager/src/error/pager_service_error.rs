use std::error::Error;
use std::fmt::{Display, Formatter};

use rootly_client::error::rootly_error::RootlyError;

/// Errors from third-party paging services (Rootly, etc.).
#[derive(Debug)]
pub enum PagerServiceError {
  /// The underlying Rootly API returned an error.
  RootlyError(RootlyError),
}

impl Error for PagerServiceError {}

impl Display for PagerServiceError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::RootlyError(err) => write!(f, "Rootly API error: {}", err),
    }
  }
}

impl From<RootlyError> for PagerServiceError {
  fn from(err: RootlyError) -> Self {
    Self::RootlyError(err)
  }
}
