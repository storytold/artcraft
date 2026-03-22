use enums_shared::error::enums_error::EnumsError;
use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum SqliteTasksError {
  SqlxError(sqlx::Error),
  EnumsError(EnumsError),
}

impl Error for SqliteTasksError {}

impl Display for SqliteTasksError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      SqliteTasksError::SqlxError(err) => write!(f, "SQLx error: {:?}", err),
      SqliteTasksError::EnumsError(err) => write!(f, "Error parsing enum: {:?}", err),
    }
  }
}

impl From<sqlx::Error> for SqliteTasksError {
  fn from(err: sqlx::Error) -> Self {
    SqliteTasksError::SqlxError(err)
  }
}

impl From<EnumsError> for SqliteTasksError {
  fn from(err: EnumsError) -> Self {
    SqliteTasksError::EnumsError(err)
  }
}
