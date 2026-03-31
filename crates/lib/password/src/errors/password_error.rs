use std::fmt;

use crate::errors::password_confirm_error::PasswordConfirmError;
use crate::errors::password_hash_error::PasswordHashError;

#[derive(Debug)]
pub enum PasswordError {
  CheckError(PasswordConfirmError),
  HashError(PasswordHashError),
}

impl fmt::Display for PasswordError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      Self::CheckError(e) => write!(f, "{}", e),
      Self::HashError(e) => write!(f, "{}", e),
    }
  }
}

impl std::error::Error for PasswordError {}

impl From<PasswordConfirmError> for PasswordError {
  fn from(err: PasswordConfirmError) -> Self {
    Self::CheckError(err)
  }
}

impl From<PasswordHashError> for PasswordError {
  fn from(err: PasswordHashError) -> Self {
    Self::HashError(err)
  }
}
