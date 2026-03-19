use crate::error::classify_fal_error::classify_fal_error;
use std::error::Error;
use std::fmt::{Display, Formatter};

/// Additional errors that aren't included in `crate::error::fal_error::FalError`.
#[derive(Debug)]
pub enum FalErrorPlus {
  /// An error arising in the `fal` crate.
  FalError(crate::error::fal_error::FalError),
  /// The fal API key is invalid.
  FalApiKeyError(String),
  /// The fal account has a billing issue
  FalBillingError(String),
  /// Another error we didn't handle.
  AnyhowError(anyhow::Error),
  /// URL parse errors.
  UrlParseError(url::ParseError),
  /// An endpoint we don't support yet.
  UnhandledEndpoint(String),
  /// Error from the `reqwest` crate.
  ReqwestError(reqwest::Error),
}

impl Display for FalErrorPlus {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::FalError(err) => write!(f, "FalErrorPlus::FalError: {:?}", err),
      Self::FalApiKeyError(reason) => write!(f, "FalErrorPlus::FalApiKeyError: {}", reason),
      Self::FalBillingError(reason) => write!(f, "FalErrorPlus::FalBillingError: {}", reason),
      Self::AnyhowError(err) => write!(f, "FalErrorPlus::AnyhowError: {:?}", err),
      Self::UrlParseError(err) => write!(f, "FalErrorPlus::UrlParseError: {:?}", err),
      Self::UnhandledEndpoint(endpoint) => write!(f, "FalErrorPlus::UnhandledEndpoint: {:?}", endpoint),
      Self::ReqwestError(err) => write!(f, "FalErrorPlus::ReqwestError: {:?}", err),
    }
  }
}

impl Error for FalErrorPlus {}

impl From<crate::error::fal_error::FalError> for FalErrorPlus {
  fn from(err: crate::error::fal_error::FalError) -> Self {
    classify_fal_error(err)
  }
}

impl From<anyhow::Error> for FalErrorPlus {
  fn from(err: anyhow::Error) -> Self {
    FalErrorPlus::AnyhowError(err)
  }
}

impl From<url::ParseError> for FalErrorPlus {
  fn from(err: url::ParseError) -> Self {
    FalErrorPlus::UrlParseError(err)
  }
}

impl From<reqwest::Error> for FalErrorPlus {
  fn from(err: reqwest::Error) -> Self {
    FalErrorPlus::ReqwestError(err)
  }
}

// Temporary: support conversion from the vendored fal crate's FalError.
// This can be removed once all `requests/queue/*` and `utils/*` files are migrated off fal::.
impl From<fal::FalError> for FalErrorPlus {
  fn from(err: fal::FalError) -> Self {
    // Convert the vendored FalError into our local FalError, then classify it.
    let local_err = match err {
      fal::FalError::RequestError(e) => crate::error::fal_error::FalError::RequestError(e),
      fal::FalError::SerializeError(e) => crate::error::fal_error::FalError::SerializeError(e),
      fal::FalError::Other(s) => crate::error::fal_error::FalError::Other(s),
      // ImageError and StreamError don't exist in our local FalError; stringify them.
      other => crate::error::fal_error::FalError::Other(format!("{}", other)),
    };
    classify_fal_error(local_err)
  }
}
