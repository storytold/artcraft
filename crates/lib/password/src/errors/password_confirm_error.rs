use std::fmt;

#[derive(Debug)]
pub enum PasswordConfirmError {
  /// The password hash is the empty string.
  HashNotProvided,
  /// The password hash is the special database sentinel value "*",
  /// which is used to indicate that the password is not set.
  HashIsSentinelValue,
  /// An error with verifying the password.
  BcryptVerifyError(bcrypt::BcryptError),
}

impl fmt::Display for PasswordConfirmError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      Self::HashNotProvided => write!(f, "password hash not provided"),
      Self::HashIsSentinelValue => write!(f, "password hash is sentinel value"),
      Self::BcryptVerifyError(e) => write!(f, "bcrypt verify error: {}", e),
    }
  }
}

impl std::error::Error for PasswordConfirmError {}

impl From<bcrypt::BcryptError> for PasswordConfirmError {
  fn from(err: bcrypt::BcryptError) -> Self {
    Self::BcryptVerifyError(err)
  }
}
