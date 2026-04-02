use std::error::Error;
use std::fmt::{Display, Formatter};

use wreq::StatusCode;

#[derive(Debug)]
pub enum Seedance2ProSpecificApiError {
  /// The session cookies are expired or invalid.
  UnauthorizedSessionExpired,

  /// The video generation request was flagged as a content violation.
  VideoGenerationViolation(String),

  /// The account does not have enough credits to perform the operation.
  BillingError {
    status_code: StatusCode,
    body: String,
  },
}

impl Error for Seedance2ProSpecificApiError {}

impl Display for Seedance2ProSpecificApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::UnauthorizedSessionExpired => write!(f, "Unauthorized: session cookies expired or invalid."),
      Self::VideoGenerationViolation(body) => write!(f, "Video generation violation: {}", body),
      Self::BillingError { status_code, body } => write!(f, "Billing error (status {}): {}", status_code, body),
    }
  }
}
