use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum SqliteTasksError {
    SqlxError(sqlx::Error),
    //TaskNotFound,
    //TaskAlreadyExists,
    //InvalidTaskStatus,
    //InvalidTaskType,
    //InvalidGenerationProvider,
}

impl Error for SqliteTasksError {}

impl Display for SqliteTasksError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      SqliteTasksError::SqlxError(err) => write!(f, "SQLx error: {}", err),
    }
  }
}

impl From<sqlx::Error> for SqliteTasksError {
  fn from(err: sqlx::Error) -> Self {
    SqliteTasksError::SqlxError(err)
  }
}
