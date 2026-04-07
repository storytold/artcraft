use std::error::Error;
use std::fmt::{Display, Formatter};

use jwt_signer::jwt_signer_error::JwtSignerError;

#[derive(Debug)]
pub enum AvtCookieError {
  /// AVT cookie payload is missing a required field.
  MissingField(&'static str),

  /// Generic decode error (e.g. invalid integer for cookie_version).
  DecodeError(String),

  /// Error encoding, decoding, or constructing the JWT signer.
  JwtSigner(JwtSignerError),
}

impl Display for AvtCookieError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::MissingField(field) => write!(f, "AVT cookie missing field: {}", field),
      Self::DecodeError(reason) => write!(f, "AVT cookie decode error: {}", reason),
      Self::JwtSigner(e) => write!(f, "JWT signer error: {}", e),
    }
  }
}

impl Error for AvtCookieError {}

impl From<JwtSignerError> for AvtCookieError {
  fn from(err: JwtSignerError) -> Self {
    Self::JwtSigner(err)
  }
}
