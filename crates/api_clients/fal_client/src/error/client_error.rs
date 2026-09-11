use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum FalClientError {
  /// The URL provided was invalid or pointed to an unexpected host.
  InvalidUrl(String),
}

impl Error for FalClientError {}

impl Display for FalClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::InvalidUrl(msg) => write!(f, "Invalid URL: {}", msg),
    }
  }
}
