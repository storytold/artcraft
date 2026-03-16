use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum MuapiSpecificApiError {
  /// Invalid API key.
  InvalidApiKey,
}

impl Error for MuapiSpecificApiError {}

impl Display for MuapiSpecificApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::InvalidApiKey => write!(f, "Unauthorized: invalid API key."),
    }
  }
}
