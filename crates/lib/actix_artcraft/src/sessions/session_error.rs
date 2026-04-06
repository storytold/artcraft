use std::error::Error;
use std::fmt::{Display, Formatter};

use jwt_signer::jwt_signer_error::JwtSignerError;

#[derive(Debug)]
pub enum SessionError {
  /// Error reading HTTP header
  HttpSessionHeaderError(String),

  /// Error encoding, decoding, or constructing the JWT signer.
  JwtSigner(JwtSignerError),
}

impl Display for SessionError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::HttpSessionHeaderError(msg) => write!(f, "HTTP session header error: {}", msg),
      Self::JwtSigner(e) => write!(f, "JWT signer error: {}", e),
    }
  }
}

impl Error for SessionError {}

impl From<JwtSignerError> for SessionError {
  fn from(err: JwtSignerError) -> Self {
    Self::JwtSigner(err)
  }
}
