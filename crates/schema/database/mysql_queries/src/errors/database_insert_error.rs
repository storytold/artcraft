use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum DatabaseInsertError {
  /// A duplicate key error occurred.
  /// This should be surfaced as a 400 to the user.
  DuplicateKeyError,

  /// An uncategorized error occurred.
  /// This will likely result in a 500 for the user.
  SqlxError(sqlx::Error),

  /// An uncategorized non-database error occurred.
  /// This will likely result in a 500 for the user.
  #[deprecated(note = "This is not very semantic. Get rid of it. Stop using it.")]
  AnyhowError(anyhow::Error),
}

impl Error for DatabaseInsertError {}

impl Display for DatabaseInsertError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      DatabaseInsertError::DuplicateKeyError => write!(f, "Duplicate key error"),
      DatabaseInsertError::SqlxError(e) => write!(f, "SQLx error: {:?}", e),
      DatabaseInsertError::AnyhowError(e) => write!(f, "Query error: {:?}", e),
    }
  }
}

impl From<anyhow::Error> for DatabaseInsertError {
  fn from(err: anyhow::Error) -> Self {
    DatabaseInsertError::AnyhowError(err)
  }
}

impl From<sqlx::Error> for DatabaseInsertError {
  fn from(err: sqlx::Error) -> Self {
    if let Some(db_err) = err.as_database_error() {
      // NB: SQLSTATE[23000]: Integrity constraint violation
      // NB: MySQL Error Code 1062: Duplicate key insertion (this is harder to access)
      let is_integrity_violation = db_err.code().as_deref() == Some("23000");
      let is_duplicate_key = db_err.message().contains("Duplicate entry");

      if is_integrity_violation && is_duplicate_key {
        return Self::DuplicateKeyError;
      }
    }

    Self::SqlxError(err)
  }
}

impl DatabaseInsertError {
  /// Whether we should surface this failure as a 400 to the user.
  /// This could be any field (for now we only have the idempotency token).
  pub fn is_400_error(&self) -> bool {
    match self {
      DatabaseInsertError::DuplicateKeyError => true,
      _ => false,
    }
  }
}
