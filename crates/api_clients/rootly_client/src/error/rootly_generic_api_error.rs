use std::error::Error;
use std::fmt::{Display, Formatter};
use reqwest::StatusCode;

#[derive(Debug)]
pub enum RootlyGenericApiError {
  /// serde_json::Error, likely from JSON deserialization schema mismatch.
  /// Includes the original body.
  SerdeResponseParseErrorWithBody(serde_json::Error, String),

  /// An uncategorized bad HTTP response.
  UncategorizedBadResponse(String),

  /// An uncategorized bad HTTP response with status code and body.
  UncategorizedBadResponseWithStatusAndBody {
    status_code: StatusCode,
    body: String,
  },

  /// An uncaught error from the HTTP client.
  ReqwestError(reqwest::Error),
}

impl Error for RootlyGenericApiError {}

impl Display for RootlyGenericApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::SerdeResponseParseErrorWithBody(err, body) => write!(f, "Failed to parse response body: {:?}. Body: {}", err, body),
      Self::UncategorizedBadResponse(msg) => write!(f, "Uncategorized bad response: {}", msg),
      Self::UncategorizedBadResponseWithStatusAndBody { status_code, body } => write!(f, "Uncategorized bad response: status code {}, body: {}", status_code, body),
      Self::ReqwestError(err) => write!(f, "Reqwest client error: {}", err),
    }
  }
}
