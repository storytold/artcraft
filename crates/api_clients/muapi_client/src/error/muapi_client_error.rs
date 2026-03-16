use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum MuapiClientError {
  /// No API key is present in the session.
  NoApiKeyPresent,

  /// Error parsing a URL.
  UrlParseError(url::ParseError),

  /// An error was encountered in building the Wreq client.
  WreqClientError(wreq::Error),
}

impl Error for MuapiClientError {}

impl Display for MuapiClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::NoApiKeyPresent => write!(f, "No API key present in the session."),
      Self::UrlParseError(err) => write!(f, "URL parse error: {}", err),
      Self::WreqClientError(err) => write!(f, "Wreq client error (during client creation): {}", err),
    }
  }
}
