use std::error::Error;

#[derive(Debug)]
pub enum EnumsApiError {
  CouldNotConvertFromString(String),
}

impl Error for EnumsApiError {}

impl std::fmt::Display for EnumsApiError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      EnumsApiError::CouldNotConvertFromString(value) => {
        write!(f, "Could not convert from string: {}", value)
      }
    }
  }
}
