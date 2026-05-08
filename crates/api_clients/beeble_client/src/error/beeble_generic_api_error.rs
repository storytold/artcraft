use std::error::Error;
use std::fmt::{Display, Formatter};

/// Catch-all for API errors that don't fit a specific variant.
#[derive(Debug)]
pub enum BeebleGenericApiError {
  /// An HTTP transport error from reqwest.
  ReqwestError(reqwest::Error),

  /// Failed to parse the response body as JSON.
  SerdeResponseParseError(serde_json::Error, String),

  /// The API returned a non-success status code.
  UncategorizedBadResponseWithStatusAndBody {
    status_code: reqwest::StatusCode,
    body: String,
  },
}

impl Error for BeebleGenericApiError {}

impl Display for BeebleGenericApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::ReqwestError(err) => write!(f, "Beeble reqwest error: {}", err),
      Self::SerdeResponseParseError(err, body) => {
        write!(f, "Beeble response parse error: {} (body: {})", err, body)
      }
      Self::UncategorizedBadResponseWithStatusAndBody { status_code, body } => {
        write!(f, "Beeble API error: status={}, body={}", status_code, body)
      }
    }
  }
}
