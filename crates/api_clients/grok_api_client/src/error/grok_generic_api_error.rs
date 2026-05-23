use std::error::Error;
use std::fmt::{Display, Formatter};

use reqwest::StatusCode;

/// Grab-bag for server-side responses that don't map to a `GrokSpecificApiError`.
#[derive(Debug)]
pub enum GrokGenericApiError {
  /// Response body didn't deserialize against the expected schema. Includes
  /// the original body so we can diagnose drift.
  SerdeResponseParseErrorWithBody(serde_json::Error, String),

  /// An uncategorized bad HTTP response with status code and body.
  UncategorizedBadResponseWithStatusAndBody {
    status_code: StatusCode,
    body: String,
  },

  /// An uncaught error from the HTTP client (e.g. network/IO).
  ReqwestError(reqwest::Error),
}

impl Error for GrokGenericApiError {}

impl Display for GrokGenericApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::SerdeResponseParseErrorWithBody(err, body) => {
        write!(f, "Failed to parse Grok API response body: {:?}. Body: {}", err, body)
      }
      Self::UncategorizedBadResponseWithStatusAndBody { status_code, body } => {
        write!(f, "Uncategorized Grok API response: status code {}, body: {}", status_code, body)
      }
      Self::ReqwestError(err) => write!(f, "Reqwest error during Grok API call: {}", err),
    }
  }
}
