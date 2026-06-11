use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum CometClientError {
  /// An error was encountered building the reqwest client or the request.
  ReqwestClientError(reqwest::Error),

  /// A request field couldn't be validated or converted to the value
  /// expected on the wire. Carries the field name and the raw input the
  /// caller supplied.
  InvalidRequestField { field: &'static str, raw_value: String, reason: String },
}

impl Error for CometClientError {}

impl Display for CometClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::ReqwestClientError(err) => write!(f, "Reqwest client error: {}", err),
      Self::InvalidRequestField { field, raw_value, reason } => {
        write!(f, "Invalid value for request field `{}`: {:?} ({})", field, raw_value, reason)
      }
    }
  }
}
