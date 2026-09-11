use std::error::Error;
use std::fmt::{Display, Formatter};

/// Errors that happen entirely on the client side — before or independent of
/// the HTTP request reaching xAI's servers.
#[derive(Debug)]
pub enum GrokClientError {
  /// No API key is present.
  NoApiKeyPresent,

  /// An error was encountered building the reqwest client.
  ReqwestClientError(reqwest::Error),

  /// The request body could not be serialized to JSON.
  RequestSerializationError(serde_json::Error),

  /// The request failed our own validation before being sent to xAI — e.g.
  /// mutually-exclusive fields supplied together, a required input missing, or
  /// an oversize payload. Detected client-side; no HTTP call was made.
  InvalidRequest(String),
}

impl Error for GrokClientError {}

impl Display for GrokClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::NoApiKeyPresent => write!(f, "No API key present."),
      Self::ReqwestClientError(err) => write!(f, "Reqwest client error (during client creation): {}", err),
      Self::RequestSerializationError(err) => write!(f, "Failed to serialize request body to JSON: {}", err),
      Self::InvalidRequest(msg) => write!(f, "Invalid request (rejected client-side before sending): {}", msg),
    }
  }
}
