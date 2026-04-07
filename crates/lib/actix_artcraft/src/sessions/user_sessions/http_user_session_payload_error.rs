use std::error::Error;
use std::fmt::{Display, Formatter};

use jwt_signer::jwt_signer_error::JwtSignerError;

#[derive(Debug)]
pub enum HttpUserSessionPayloadError {
  /// Error reading HTTP header
  HttpSessionHeaderError(String),

  /// Error encoding, decoding, or constructing the JWT signer.
  JwtSigner(JwtSignerError),
}

impl Display for HttpUserSessionPayloadError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::HttpSessionHeaderError(msg) => write!(f, "HTTP session header error: {}", msg),
      Self::JwtSigner(e) => write!(f, "JWT signer error: {}", e),
    }
  }
}

impl Error for HttpUserSessionPayloadError {}

impl From<JwtSignerError> for HttpUserSessionPayloadError {
  fn from(err: JwtSignerError) -> Self {
    Self::JwtSigner(err)
  }
}
