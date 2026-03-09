use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum WorldLabsSpecificApiError {
  /// There aren't sufficient funds for generation.
  InsufficientCredits,
}

impl Error for WorldLabsSpecificApiError {}

impl Display for WorldLabsSpecificApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::InsufficientCredits => write!(f, "Insufficient credits"),
    }
  }
}
