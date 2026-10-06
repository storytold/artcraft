use crate::error::ark_api_error::ArkApiError;
use std::error::Error;
use std::fmt::{Display, Formatter};

/// Every way a ModelArk call can fail.
#[derive(Debug)]
pub enum ArkError {
  /// The HTTP client could not be built.
  ClientBuild(reqwest::Error),

  /// No usable response: DNS, TLS, timeout or a dropped connection.
  Network(reqwest::Error),

  /// ModelArk answered with an error status (or a failed task/image error object).
  Api(ArkApiError),

  /// A 2xx response didn't match the expected shape. Keeps the body to diagnose API drift.
  ResponseParse {
    error: serde_json::Error,
    body: String,
  },
}

impl ArkError {
  /// A message suitable to show the user.
  pub fn user_message(&self) -> String {
    match self {
      Self::Api(err) => err.user_message(),
      Self::Network(err) if err.is_timeout() => {
        "BytePlus took too long to respond. Try again.".to_string()
      }
      Self::Network(_) | Self::ClientBuild(_) => {
        "Could not reach BytePlus. Check your internet connection.".to_string()
      }
      Self::ResponseParse { .. } => "BytePlus returned an unexpected response.".to_string(),
    }
  }
}

impl Error for ArkError {}

impl Display for ArkError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl From<ArkApiError> for ArkError {
  fn from(error: ArkApiError) -> Self {
    Self::Api(error)
  }
}
