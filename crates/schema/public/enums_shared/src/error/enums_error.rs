use std::error::Error;

#[derive(Debug)]
pub enum EnumsError {
  CouldNotConvertFromString(String),
}

impl Error for EnumsError {}

impl std::fmt::Display for EnumsError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      EnumsError::CouldNotConvertFromString(value) => {
        write!(f, "Could not convert from string: {}", value)
      }
    }
  }
}
