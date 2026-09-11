use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum SendableEventError {
  TauriError(tauri::Error),
  AnyhowError(anyhow::Error),
}

impl Error for SendableEventError {}

impl Display for SendableEventError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::TauriError(err) => write!(f, "SendableEventError::TauriError: {}", err),
      Self::AnyhowError(err) => write!(f, "SendableEventError::AnyhowError: {}", err),
    }
  }
}

impl From<anyhow::Error> for SendableEventError {
  fn from(err: anyhow::Error) -> Self {
    SendableEventError::AnyhowError(err)
  }
}

impl From<tauri::Error> for SendableEventError {
  fn from(err: tauri::Error) -> Self {
    SendableEventError::TauriError(err)
  }
}
