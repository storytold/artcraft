use std::error::Error;
use std::fmt::{Display, Formatter};

use reqwest::StatusCode;

/// Server-side errors with unknown / grab-bag causes.
#[derive(Debug)]
pub enum CometGenericApiError {
  /// serde_json::Error, likely from a JSON deserialization schema mismatch.
  /// Includes the original body.
  SerdeResponseParseErrorWithBody(serde_json::Error, String),

  /// An uncategorized bad HTTP response with status code and body.
  UncategorizedBadResponseWithStatusAndBody {
    status_code: StatusCode,
    body: String,
  },

  /// An uncaught error from the HTTP client (network failures, timeouts, etc.)
  ReqwestError(reqwest::Error),
}

impl Error for CometGenericApiError {}

impl Display for CometGenericApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::SerdeResponseParseErrorWithBody(err, body) => write!(f, "Failed to parse response body: {:?}. Body: {}", err, body),
      Self::UncategorizedBadResponseWithStatusAndBody { status_code, body } => write!(f, "Uncategorized bad response: status code {}, body: {}", status_code, body),
      Self::ReqwestError(err) => write!(f, "Reqwest error: {}", err),
    }
  }
}
