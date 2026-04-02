
// TODO(bt,2024-10-01): This is only used for inserts into the idempotency table. We should move or rename it.
#[derive(Debug)]
#[deprecated(note="This is an old error type.")]
pub enum DatabaseQueryError {
  /// A duplicate idempotency token error occurred.
  /// This should be surfaced as a 400 to the user.
  #[deprecated(note="This is an old error type.")]
  IdempotencyDuplicateKeyError,

  /// An uncategorized error occurred.
  /// This will likely result in a 500 for the user.
  #[deprecated(note="This is an old error type.")]
  SqlxError(sqlx::Error),

  /// An uncategorized non-database error occurred.
  /// This will likely result in a 500 for the user.
  #[deprecated(note="This is an old error type.")]
  AnyhowError(anyhow::Error),
}

impl std::error::Error for DatabaseQueryError {}

impl std::fmt::Display for DatabaseQueryError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      DatabaseQueryError::IdempotencyDuplicateKeyError => write!(f, "Idempotency duplicate key error"),
      DatabaseQueryError::SqlxError(err) => write!(f, "SQLX error: {}", err),
      DatabaseQueryError::AnyhowError(err) => write!(f, "Anyhow error: {}", err),
    }
  }
}

impl From<anyhow::Error> for DatabaseQueryError {
  fn from(err: anyhow::Error) -> Self {
    DatabaseQueryError::AnyhowError(err)
  }
}

impl From<sqlx::Error> for DatabaseQueryError {
  fn from(err: sqlx::Error) -> Self {
    if let Some(db_err) = err.as_database_error() {
      // NB: SQLSTATE[23000]: Integrity constraint violation
      // NB: MySQL Error Code 1062: Duplicate key insertion (this is harder to access)
      let is_integrity_violation = db_err.code().as_deref() == Some("23000");
      let is_duplicate_key = db_err.message().contains("Duplicate entry");

      // We currently only detect idempotency token errors in a cross-cutting fashion, but
      // we could easily add detection for other fields.
      let is_idempotency_error = db_err.message().contains("uuid_idempotency_token");

      if is_integrity_violation && is_duplicate_key && is_idempotency_error {
        return Self::IdempotencyDuplicateKeyError;
      }
    }

    Self::SqlxError(err)
  }
}

impl DatabaseQueryError {
  /// Whether we should surface this failure as a 400 to the user.
  /// This could be any field (for now we only have the idempotency token).
  pub fn is_400_error(&self) -> bool {
    match self {
      DatabaseQueryError::IdempotencyDuplicateKeyError => true,
      _ => false,
    }
  }

  /// Whether we should surface this failure as a 400 to the user.
  /// Specifically, if we know it was the idempotency token.
  pub fn had_duplicate_idempotency_token(&self) -> bool {
    match self {
      DatabaseQueryError::IdempotencyDuplicateKeyError => true,
      _ => false,
    }
  }
}
