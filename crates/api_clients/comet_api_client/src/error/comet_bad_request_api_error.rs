use std::error::Error;
use std::fmt::{Display, Formatter};

/// These represent known "400s" that are the fault of the client sending a
/// bad request. They should surface to the end user as 400s.
#[derive(Debug)]
pub enum CometBadRequestApiError {
  /// The video creation request was rejected for invalid parameters (eg.
  /// missing prompt, out-of-range duration, an `input_reference` image on a
  /// model that doesn't support image input).
  InvalidRequestParameters { raw_body: String },
}

impl Error for CometBadRequestApiError {}

impl Display for CometBadRequestApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::InvalidRequestParameters { raw_body } => write!(f, "Invalid request parameters: {}", raw_body),
    }
  }
}
