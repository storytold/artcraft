use std::fmt;

/// Errors that occur client-side before/during request construction.
#[derive(Debug)]
pub enum GmiCloudClientError {
  /// The API key was not provided or is empty.
  NoApiKeyPresent,

  /// A reqwest client-level error.
  ReqwestError(reqwest::Error),
}

impl fmt::Display for GmiCloudClientError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl From<reqwest::Error> for GmiCloudClientError {
  fn from(err: reqwest::Error) -> Self {
    Self::ReqwestError(err)
  }
}
