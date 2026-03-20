use enums::error::enum_error::EnumError;
use enums_shared::error::enums_error::EnumsError;
use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum SqliteTasksError {
  SqlxError(sqlx::Error),
  EnumError(EnumError),
  EnumsError(EnumsError),
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
      SqliteTasksError::SqlxError(err) => write!(f, "SQLx error: {:?}", err),
      SqliteTasksError::EnumError(err) => write!(f, "Error parsing enum: {:?}", err),
      SqliteTasksError::EnumsError(err) => write!(f, "Error parsing enum: {:?}", err),
    }
  }
}

impl From<sqlx::Error> for SqliteTasksError {
  fn from(err: sqlx::Error) -> Self {
    SqliteTasksError::SqlxError(err)
  }
}

impl From<EnumError> for SqliteTasksError {
  fn from(err: EnumError) -> Self {
    SqliteTasksError::EnumError(err)
  }
}

impl From<EnumsError> for SqliteTasksError {
  fn from(err: EnumsError) -> Self {
    SqliteTasksError::EnumsError(err)
  }
}
