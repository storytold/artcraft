use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum JwtError {
  /// Generic error parsing the JWT
  ParseError(String),
  /// Error parsing the JWT JSON payload specifically
  JsonParseError(serde_json::Error),
  /// Error decoding the base64 payload
  Base64DecodeError(base64::DecodeError),
  /// Error decoding from UTF-8 (should be exceedingly rare)
  Utf8Error(std::string::FromUtf8Error),
  /// Error parsing a common field (iat, exp, etc.)
  CommonFieldError(String),
  /// Error parsing a custom claims field.
  CustomClaimsFieldError(String),
}

impl Error for JwtError {}

impl Display for JwtError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::ParseError(reason) => { write!(f, "JwtError::ParseError : {}", reason) }
      Self::JsonParseError(err) => { write!(f, "JwtError::JsonParseError : {:?}", err) }
      Self::Base64DecodeError(err) => { write!(f, "JwtError::Base64DecodeError : {:?}", err) }
      Self::Utf8Error(err) => { write!(f, "JwtError::Utf8Error : {:?}", err) }
      Self::CommonFieldError(reason) => { write!(f, "JwtError::CommonFieldError : {}", reason) }
      Self::CustomClaimsFieldError(reason) => { write!(f, "JwtError::CustomClaimsFieldError : {}", reason) }
    }
  }
}

impl From<serde_json::Error> for JwtError {
  fn from(err: serde_json::Error) -> Self {
    JwtError::JsonParseError(err)
  }
}

impl From<base64::DecodeError> for JwtError {
  fn from(err: base64::DecodeError) -> Self {
    JwtError::Base64DecodeError(err)
  }
}

impl From<std::string::FromUtf8Error> for JwtError {
  fn from(err: std::string::FromUtf8Error) -> Self {
    JwtError::Utf8Error(err)
  }
}
