use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum Seedance2ProClientError {
  /// No cookies are present in the session.
  NoCookiesPresent,

  /// Error parsing a URL.
  UrlParseError(url::ParseError),

  /// An error was encountered in building the Wreq client.
  WreqClientError(wreq::Error),

  /// A request field couldn't be parsed into the value expected on the wire.
  /// Carries the field name and the raw input the caller supplied.
  InvalidRequestField { field: &'static str, raw_value: String, reason: String },
}

impl Error for Seedance2ProClientError {}

impl Display for Seedance2ProClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::NoCookiesPresent => write!(f, "No cookies present in the session."),
      Self::UrlParseError(err) => write!(f, "URL parse error: {}", err),
      Self::WreqClientError(err) => write!(f, "Wreq client error (during client creation): {}", err),
      Self::InvalidRequestField { field, raw_value, reason } => {
        write!(f, "Invalid value for request field `{}`: {:?} ({})", field, raw_value, reason)
      }
    }
  }
}
