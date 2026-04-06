use std::error::Error;
use std::fmt::{Display, Formatter};

use actix_artcraft::sessions::session_error::SessionError;

#[derive(Debug)]
pub enum SessionCheckerError {
  /// Error decoding or verifying the session.
  /// Rate of failures can point to the cause:
  /// - One-off errors: probably session forgeries
  /// - Lots of errors: maybe the wrong hmac secret
  Session(SessionError),

  /// Error looking up the session from the database.
  Sqlx(sqlx::Error),

  /// Some other kind of error - perhaps with the Redis middleware.
  OtherError(anyhow::Error),
}

impl Display for SessionCheckerError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Session(e) => write!(f, "session error: {}", e),
      Self::Sqlx(e) => write!(f, "sqlx error: {}", e),
      Self::OtherError(e) => write!(f, "other error: {}", e),
    }
  }
}

impl Error for SessionCheckerError {}

impl From<SessionError> for SessionCheckerError {
  fn from(err: SessionError) -> Self {
    Self::Session(err)
  }
}

impl From<sqlx::Error> for SessionCheckerError {
  fn from(err: sqlx::Error) -> Self {
    Self::Sqlx(err)
  }
}

impl From<anyhow::Error> for SessionCheckerError {
  fn from(err: anyhow::Error) -> Self {
    Self::OtherError(err)
  }
}
