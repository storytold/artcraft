use std::error::Error;
use std::fmt::{Display, Formatter};
use wreq::StatusCode;

#[derive(Debug)]
pub enum WorldLabsGenericApiError {
  /// Unknown error occurred when uploading to signed URL
  GoogleUploadFailed {
    status_code: StatusCode,
    body: String,
  },

  /// serde_json::Error, likely from JSON deserialization schema mismatch.
  /// Includes the original body.
  SerdeResponseParseErrorWithBody(serde_json::Error, String),

  /// An uncategorized bad HTTP response.
  UncategorizedBadResponseWithStatusAndBody {
    status_code: StatusCode,
    body: String,
  },

  /// An uncaught error from the API client.
  WreqError(wreq::Error),
}

impl Error for WorldLabsGenericApiError {}

impl Display for WorldLabsGenericApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::GoogleUploadFailed { status_code, body } => write!(f, "Signed URL upload failed with HTTP {}: {:?}", status_code, body),
      Self::SerdeResponseParseErrorWithBody(err, body) => write!(f, "Failed to parse response body: {:?}. Body: {}", err, body),
      Self::UncategorizedBadResponseWithStatusAndBody { status_code, body } => write!(f, "Uncategorized bad response: status code {}, body: {}", status_code, body),
      Self::WreqError(err) => write!(f, "Wreq client error: {}", err),
    }
  }
}
