use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum RootlyClientError {
  /// No API key is present.
  NoApiKeyPresent,

  /// An error was encountered in building the reqwest client.
  ReqwestClientError(reqwest::Error),
}

impl Error for RootlyClientError {}

impl Display for RootlyClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::NoApiKeyPresent => write!(f, "No API key present."),
      Self::ReqwestClientError(err) => write!(f, "Reqwest client error (during client creation): {}", err),
    }
  }
}
