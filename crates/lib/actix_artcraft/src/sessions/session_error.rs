use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum SessionError {
  /// Error reading HTTP header
  HttpSessionHeaderError(String),

  /// Error decoding and verifying a JWT to claims
  JwtVerifyError(jwt::Error),

  /// Error encoding and signing JWT claims
  JwtSignError(jwt::Error),

  /// Error constructing the JWT signer.
  JwtInvalidKeyLength,
}

impl Display for SessionError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::HttpSessionHeaderError(msg) => write!(f, "HTTP session header error: {}", msg),
      Self::JwtVerifyError(e) => write!(f, "JWT verify error: {}", e),
      Self::JwtSignError(e) => write!(f, "JWT sign error: {}", e),
      Self::JwtInvalidKeyLength => write!(f, "JWT signer construction failed: invalid key length"),
    }
  }
}

impl Error for SessionError {}
