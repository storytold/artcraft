use crate::error::beeble_client_error::BeebleClientError;
use crate::error::beeble_generic_api_error::BeebleGenericApiError;
use crate::error::beeble_specific_api_error::BeebleSpecificApiError;
use std::error::Error;

#[derive(Debug)]
pub enum BeebleError {
  Client(BeebleClientError),
  ApiSpecific(BeebleSpecificApiError),
  ApiGeneric(BeebleGenericApiError),
}

impl Error for BeebleError {}

impl std::fmt::Display for BeebleError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(e) => write!(f, "BeebleClientError: {:?}", e),
      Self::ApiSpecific(e) => write!(f, "BeebleSpecificApiError: {:?}", e),
      Self::ApiGeneric(e) => write!(f, "BeebleGenericApiError: {:?}", e),
    }
  }
}

impl From<BeebleClientError> for BeebleError {
  fn from(error: BeebleClientError) -> Self {
    Self::Client(error)
  }
}

impl From<BeebleSpecificApiError> for BeebleError {
  fn from(error: BeebleSpecificApiError) -> Self {
    Self::ApiSpecific(error)
  }
}

impl From<BeebleGenericApiError> for BeebleError {
  fn from(error: BeebleGenericApiError) -> Self {
    Self::ApiGeneric(error)
  }
}
