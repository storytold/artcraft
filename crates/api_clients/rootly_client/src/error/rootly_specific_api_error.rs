use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum RootlySpecificApiError {
  /// The API key is invalid or expired.
  Unauthorized,
}

impl Error for RootlySpecificApiError {}

impl Display for RootlySpecificApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Unauthorized => write!(f, "Unauthorized: API key is invalid or expired."),
    }
  }
}
