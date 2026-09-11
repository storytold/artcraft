use std::error::Error;

#[derive(Debug)]
pub enum EnumError {
  CouldNotConvertFromString(String),
}

impl Error for EnumError {}

impl std::fmt::Display for EnumError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      EnumError::CouldNotConvertFromString(value) => {
        write!(f, "Could not convert from string: {}", value)
      }
    }
  }
}
