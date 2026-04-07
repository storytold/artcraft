use std::error::Error;
use std::fmt::{Display, Formatter};

use jwt_signer::jwt_signer_error::JwtSignerError;

#[derive(Debug)]
pub enum AvtCookiePayloadError {
  /// AVT cookie payload is missing a required field.
  MissingField(&'static str),

  /// Generic decode error (e.g. invalid integer for cookie_version).
  PayloadDecodeError(String),

  /// Error encoding, decoding, or constructing the JWT signer.
  JwtSigner(JwtSignerError),
}

impl AvtCookiePayloadError {
  pub fn is_server_error(&self) -> bool {
    match self {
      // JWT verify errors (eg. forged cookies) → 400 bad input.
      AvtCookiePayloadError::JwtSigner(JwtSignerError::JwtVerifyError(_)) => {
        false
      },
      // Server-side JWT signer failures (bad HMAC config, signing failure) → 500.
      AvtCookiePayloadError::JwtSigner(
        JwtSignerError::JwtInvalidKeyLength | JwtSignerError::JwtSignError(_)
      ) => {
        true
      },
      // Other payload decode failures (how did these make it into the wild!?) → 500
      AvtCookiePayloadError::MissingField(_) | AvtCookiePayloadError::PayloadDecodeError(_) => {
        true
      }
    }
  }
}

impl Display for AvtCookiePayloadError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::MissingField(field) => write!(f, "AVT cookie missing field: {}", field),
      Self::PayloadDecodeError(reason) => write!(f, "AVT cookie decode error: {}", reason),
      Self::JwtSigner(e) => write!(f, "JWT signer error: {}", e),
    }
  }
}

impl Error for AvtCookiePayloadError {}

impl From<JwtSignerError> for AvtCookiePayloadError {
  fn from(err: JwtSignerError) -> Self {
    Self::JwtSigner(err)
  }
}
