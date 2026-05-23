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
}

impl Error for GrokClientError {}

impl Display for GrokClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::NoApiKeyPresent => write!(f, "No API key present."),
      Self::ReqwestClientError(err) => write!(f, "Reqwest client error (during client creation): {}", err),
      Self::RequestSerializationError(err) => write!(f, "Failed to serialize request body to JSON: {}", err),
    }
  }
}
