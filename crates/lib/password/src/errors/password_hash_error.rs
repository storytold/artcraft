use std::fmt;

#[derive(Debug)]
pub enum PasswordHashError {
  /// An error with hashing the password.
  BcryptHashError(bcrypt::BcryptError),
}

impl fmt::Display for PasswordHashError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      Self::BcryptHashError(e) => write!(f, "bcrypt hash error: {}", e),
    }
  }
}

impl std::error::Error for PasswordHashError {}

impl From<bcrypt::BcryptError> for PasswordHashError {
  fn from(err: bcrypt::BcryptError) -> Self {
    Self::BcryptHashError(err)
  }
}
