use std::fmt;

/// Server-side errors with unknown or generic causes.
#[derive(Debug)]
pub enum GmiCloudGenericApiError {
  /// Failed to parse the JSON response body.
  SerdeResponseParseErrorWithBody(serde_json::Error, String),

  /// Non-200 response that couldn't be classified.
  UncategorizedBadResponseWithStatusAndBody { status_code: u16, body: String },

  /// A reqwest transport error.
  ReqwestError(reqwest::Error),
}

impl fmt::Display for GmiCloudGenericApiError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl From<reqwest::Error> for GmiCloudGenericApiError {
  fn from(err: reqwest::Error) -> Self {
    Self::ReqwestError(err)
  }
}
