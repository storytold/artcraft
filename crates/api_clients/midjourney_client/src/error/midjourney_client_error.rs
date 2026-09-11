use std::error::Error;
use std::fmt::{Display, Formatter};
use std::io;
use std::path::PathBuf;

/// An error arising from the client, either before or after the request is sent.
#[derive(Debug)]
pub enum MidjourneyClientError {
  /// The cookie was too short to be valid.
  CookieTooShort,
  
  /// Tried to look up an image out of range [0,4)
  InvalidImageIndex,
  
  /// Could not determine the filetype for the file.
  FileTypeNotKnown(PathBuf),

  /// Could not handle the file type.
  FileTypeNotHandled(PathBuf),

  /// An error doing file I/O (on our side)
  IoError(io::Error),

  // /// An error setting up the client
  // ReqwestError(reqwest::Error),
  WreqError(wreq::Error),

  /// A serialization error with the request.
  SerializationError(serde_json::Error),
}

impl Error for MidjourneyClientError {}

impl Display for MidjourneyClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::CookieTooShort => write!(f, "The cookie header is too short to be valid."),
      Self::InvalidImageIndex => write!(f, "The image index is out of range. Valid range is [0, 4)."),
      Self::FileTypeNotKnown(path) => write!(f, "Could not determine the filetype for the file: {:?}", path),
      Self::FileTypeNotHandled(path) => write!(f, "Could not handle the file type for the file: {:?}", path),
      Self::IoError(err) => write!(f, "IO error: {}", err),
      //Self::ReqwestError(err) => write!(f, "Reqwest client error: {}", err),
      Self::WreqError(err) => write!(f, "Wreq client error: {}", err),
      Self::SerializationError(err) => write!(f, "Request serialization error: {}", err),
    }
  }
}

impl From<io::Error> for MidjourneyClientError {
  fn from(error: io::Error) -> Self {
    Self::IoError(error)
  }
}

impl From<serde_json::Error> for MidjourneyClientError {
  fn from(error: serde_json::Error) -> Self {
    Self::SerializationError(error)
  }
}

/*impl From<reqwest::Error> for MidjourneyClientError {
  fn from(error: reqwest::Error) -> Self {
    Self::ReqwestError(error)
  }
}*/

impl From<wreq::Error> for MidjourneyClientError {
  fn from(error: wreq::Error) -> Self {
    Self::WreqError(error)
  }
}
