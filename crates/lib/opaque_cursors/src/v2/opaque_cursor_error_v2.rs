use std::fmt;
use std::string::FromUtf8Error;

use magic_crypt::MagicCryptError;

#[derive(Debug)]
pub enum OpaqueCursorErrorV2 {
  SerdeError(serde_json::Error),
  MagicCryptError(MagicCryptError),
  Base64DecodeError(base64::DecodeError),
  Utf8Error(FromUtf8Error),
  /// The decoded cursor did not contain a name at all.
  DecodedNameNotPresent,
  /// The decoded cursor's name did not match the expected name.
  DecodedNameMismatch { expected: String, actual: String },
}

impl fmt::Display for OpaqueCursorErrorV2 {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl std::error::Error for OpaqueCursorErrorV2 {}

impl From<serde_json::Error> for OpaqueCursorErrorV2 {
  fn from(err: serde_json::Error) -> Self {
    Self::SerdeError(err)
  }
}

impl From<MagicCryptError> for OpaqueCursorErrorV2 {
  fn from(err: MagicCryptError) -> Self {
    Self::MagicCryptError(err)
  }
}

impl From<base64::DecodeError> for OpaqueCursorErrorV2 {
  fn from(err: base64::DecodeError) -> Self {
    Self::Base64DecodeError(err)
  }
}

impl From<FromUtf8Error> for OpaqueCursorErrorV2 {
  fn from(err: FromUtf8Error) -> Self {
    Self::Utf8Error(err)
  }
}
