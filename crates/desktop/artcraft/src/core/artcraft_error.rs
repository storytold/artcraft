use grok_consumer_client::error::grok_error::GrokError;
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::path::PathBuf;
use artcraft_client::error::storyteller_error::StorytellerError;

#[derive(Debug)]
pub enum ArtcraftError {
  AnyhowError(anyhow::Error),
  DecodeError(base64::DecodeError),
  IoError(std::io::Error),
  ReqwestError(reqwest::Error),
  // Service errors
  GrokError(GrokError),
  StorytellerError(StorytellerError),
  // Lock errors
  RwLockReadError,
  RwLockWriteError,
  MutexLockError,
  // Download errors
  BadDownloadFilename { path: PathBuf },
  CannotDownloadFilePathAlreadyExists { path: PathBuf },
}

impl Error for ArtcraftError {}

impl Display for ArtcraftError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::AnyhowError(e) => write!(f, "AnyhowError: {:?}", e),
      Self::DecodeError(e) => write!(f, "DecodeError: {:?}", e),
      Self::IoError(e) => write!(f, "IoError: {:?}", e),
      Self::ReqwestError(e) => write!(f, "ReqwestError: {:?}", e),
      Self::GrokError(e) => write!(f, "GrokError: {:?}", e),
      Self::StorytellerError(e) => write!(f, "StorytellerError: {:?}", e),
      Self::RwLockReadError => write!(f, "RwLockReadError"),
      Self::RwLockWriteError => write!(f, "RwLockWriteError"),
      Self::MutexLockError => write!(f, "MutexLockError"),
      Self::BadDownloadFilename { path } => write!(f, "BadDownloadFilename: {:?}", path),
      Self::CannotDownloadFilePathAlreadyExists { path } => write!(f, "CannotDownloadFilePathAlreadyExists {:?}", path),
    }
  }
}

impl From<anyhow::Error> for ArtcraftError {
  fn from(value: anyhow::Error) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<base64::DecodeError> for ArtcraftError {
  fn from(value: base64::DecodeError) -> Self {
    Self::DecodeError(value)
  }
}

impl From<std::io::Error> for ArtcraftError {
  fn from(value: std::io::Error) -> Self {
    Self::IoError(value)
  }
}

impl From<reqwest::Error> for ArtcraftError {
  fn from(value: reqwest::Error) -> Self {
    Self::ReqwestError(value)
  }
}

impl From<GrokError> for ArtcraftError {
  fn from(value: GrokError) -> Self {
    Self::GrokError(value)
  }
}

impl From<StorytellerError> for ArtcraftError {
  fn from(value: StorytellerError) -> Self {
    Self::StorytellerError(value)
  }
}

