use std::error::Error;

use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::error::grok_specific_api_error::GrokSpecificApiError;

/// Top-level error for the Grok API client. Sum of every failure mode any
/// endpoint can produce.
#[derive(Debug)]
pub enum GrokError {
  Client(GrokClientError),
  ApiSpecific(GrokSpecificApiError),
  ApiGeneric(GrokGenericApiError),
}

impl Error for GrokError {}

impl std::fmt::Display for GrokError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(e) => write!(f, "GrokClientError: {:?}", e),
      Self::ApiSpecific(e) => write!(f, "GrokSpecificApiError: {:?}", e),
      Self::ApiGeneric(e) => write!(f, "GrokGenericApiError: {:?}", e),
    }
  }
}

impl From<GrokClientError> for GrokError {
  fn from(error: GrokClientError) -> Self {
    Self::Client(error)
  }
}

impl From<GrokSpecificApiError> for GrokError {
  fn from(error: GrokSpecificApiError) -> Self {
    Self::ApiSpecific(error)
  }
}

impl From<GrokGenericApiError> for GrokError {
  fn from(error: GrokGenericApiError) -> Self {
    Self::ApiGeneric(error)
  }
}
