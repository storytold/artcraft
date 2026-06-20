use std::fmt;
use std::io;

/// Errors produced by [`crate::BucketClient`] and [`crate::BucketClientBuilder`].
#[derive(Debug)]
pub enum BucketClientError {
  /// An error surfaced by the underlying `rust-s3` client.
  S3Error(s3::error::S3Error),

  /// A local I/O error (e.g. while reading bytes to upload).
  IoError(io::Error),

  /// The builder was misconfigured — a required field was missing, or client
  /// construction failed for a reason we can describe.
  ClientBuilderSetupError(String),

  /// The object store accepted the request but returned a non-success status.
  UploadFailed { status_code: u16, message: String },
}

impl fmt::Display for BucketClientError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      Self::S3Error(err) => write!(f, "S3 error: {}", err),
      Self::IoError(err) => write!(f, "I/O error: {}", err),
      Self::ClientBuilderSetupError(message) => {
        write!(f, "bucket client setup error: {}", message)
      }
      Self::UploadFailed { status_code, message } => {
        write!(f, "upload failed (HTTP {}): {}", status_code, message)
      }
    }
  }
}

impl std::error::Error for BucketClientError {
  fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
    match self {
      Self::S3Error(err) => Some(err),
      Self::IoError(err) => Some(err),
      _ => None,
    }
  }
}

impl From<s3::error::S3Error> for BucketClientError {
  fn from(err: s3::error::S3Error) -> Self {
    Self::S3Error(err)
  }
}

impl From<io::Error> for BucketClientError {
  fn from(err: io::Error) -> Self {
    Self::IoError(err)
  }
}
