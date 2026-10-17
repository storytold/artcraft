//! Errors that can happen on any fal call, whatever the model: a response we could not
//! parse, or a bad HTTP reply we have no specific category for.

use std::error::Error;
use std::fmt::{Display, Formatter};
use reqwest::StatusCode;

/// A generic problem with a fal API response. Wrapped by `FalErrorPlus::ApiGeneric`.
#[derive(Debug)]
pub enum FalGenericApiError {
  /// serde_json::Error, likely from JSON deserialization schema mismatch.
  /// Includes the original body.
  SerdeResponseParseErrorWithBody {
    error: serde_json::Error,
    body: String,
  },

  /// An uncategorized bad HTTP response.
  UncategorizedBadResponseWithStatusAndBody {
    status_code: StatusCode,
    body: String,
  },
}

impl Error for FalGenericApiError {}

impl Display for FalGenericApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::SerdeResponseParseErrorWithBody { error, body } => {
        write!(f, "Failed to parse response body: {:?}. Body: {}", error, body)
      }
      Self::UncategorizedBadResponseWithStatusAndBody { status_code, body } => {
        write!(f, "Uncategorized bad response: status code {}, body: {}", status_code, body)
      }
    }
  }
}
