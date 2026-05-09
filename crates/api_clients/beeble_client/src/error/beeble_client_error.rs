use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum BeebleClientError {
  /// No API key is present.
  NoApiKeyPresent,

  /// An error was encountered in building the reqwest client.
  ReqwestClientError(reqwest::Error),

  /// A serialization error with the request.
  SerializationError(serde_json::Error),
}

impl Error for BeebleClientError {}

impl Display for BeebleClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::NoApiKeyPresent => write!(f, "No API key present."),
      Self::ReqwestClientError(err) => write!(f, "Reqwest client error: {}", err),
      Self::SerializationError(err) => write!(f, "Serialization error: {}", err),
    }
  }
}
