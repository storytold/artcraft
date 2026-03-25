use std::error::Error;
use std::fmt::{Display, Formatter};

use rootly_client::error::rootly_error::RootlyError;

/// Errors from the pager client (HTTP/API layer).
#[derive(Debug)]
pub enum PagerClientError {
  /// The underlying Rootly API returned an error.
  RootlyError(RootlyError),

  /// The pager client is not configured (missing API key, etc.).
  NotConfigured(String),
}

impl Error for PagerClientError {}

impl Display for PagerClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::RootlyError(err) => write!(f, "Rootly API error: {}", err),
      Self::NotConfigured(reason) => write!(f, "Pager client not configured: {}", reason),
    }
  }
}

impl From<RootlyError> for PagerClientError {
  fn from(err: RootlyError) -> Self {
    Self::RootlyError(err)
  }
}
