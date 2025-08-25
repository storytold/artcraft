use crate::error::classify_fal_error::classify_fal_error;
use std::error::Error;
use std::fmt::{Display, Formatter};

/// Additional errors that aren't included in `fal::FalError`.
#[derive(Debug)]
pub enum FalErrorPlus {
  /// An error arising in the `fal` crate.
  FalError(fal::FalError),
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

impl From<fal::FalError> for FalErrorPlus {
  fn from(err: fal::FalError) -> Self {
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
