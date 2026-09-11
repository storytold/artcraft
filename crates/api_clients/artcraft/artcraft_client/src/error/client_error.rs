use std::error::Error;
use std::fmt::{Display, Formatter};
use std::io;
use std::path::PathBuf;
use crate::error::api_error::ApiError;

/// An error arising from the client, either before or after the request is sent.
#[derive(Debug)]
pub enum ClientError {
  /// An invalid request was detected before it was sent.
  InvalidPreflightRequest(String),
  
  /// Could not determine the filetype for the file.
  FileTypeNotKnown(PathBuf),

  /// Could not handle the file type.
  FileTypeNotHandled(PathBuf),

  /// An error doing file I/O (on our side)
  IoError(io::Error),

  /// An error setting up the client
  ReqwestError(reqwest::Error),
  
  /// A serialization error with the request.
  SerializationError(serde_json::Error),
}

impl Error for ClientError {}

impl Display for ClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::InvalidPreflightRequest(msg) => write!(f, "Invalid preflight request: {}", msg),
      Self::FileTypeNotKnown(path) => write!(f, "Could not determine the filetype for the file: {:?}", path),
      Self::FileTypeNotHandled(path) => write!(f, "Could not handle the file type for the file: {:?}", path),
      Self::IoError(err) => write!(f, "IO error: {}", err),
      Self::ReqwestError(err) => write!(f, "Reqwest client error: {}", err),
      Self::SerializationError(err) => write!(f, "Request serialization error: {}", err),
    }
  }
}

impl From<io::Error> for ClientError {
  fn from(error: io::Error) -> Self {
    ClientError::IoError(error)
  }
}

impl From<serde_json::Error> for ClientError {
  fn from(error: serde_json::Error) -> Self {
    ClientError::SerializationError(error)
  }
}

impl From<reqwest::Error> for ClientError {
  fn from(error: reqwest::Error) -> Self {
    ClientError::ReqwestError(error)
  }
}
