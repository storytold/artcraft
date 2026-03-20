use std::error::Error;

#[derive(Debug)]
pub enum EnumsDbError {
  CouldNotConvertFromString(String),
}

impl Error for EnumsDbError {}

impl std::fmt::Display for EnumsDbError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      EnumsDbError::CouldNotConvertFromString(value) => {
        write!(f, "Could not convert from string: {}", value)
      }
    }
  }
}
