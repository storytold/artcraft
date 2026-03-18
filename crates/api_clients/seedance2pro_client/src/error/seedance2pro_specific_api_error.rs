use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum Seedance2ProSpecificApiError {
  /// The session cookies are expired or invalid.
  UnauthorizedSessionExpired,

  /// The video generation request was flagged as a content violation.
  VideoGenerationViolation(String),
}

impl Error for Seedance2ProSpecificApiError {}

impl Display for Seedance2ProSpecificApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::UnauthorizedSessionExpired => write!(f, "Unauthorized: session cookies expired or invalid."),
      Self::VideoGenerationViolation(body) => write!(f, "Video generation violation: {}", body),
    }
  }
}
