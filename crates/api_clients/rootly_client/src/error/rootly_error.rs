use crate::error::rootly_client_error::RootlyClientError;
use crate::error::rootly_generic_api_error::RootlyGenericApiError;
use crate::error::rootly_specific_api_error::RootlySpecificApiError;
use std::error::Error;

#[derive(Debug)]
pub enum RootlyError {
  Client(RootlyClientError),
  ApiSpecific(RootlySpecificApiError),
  ApiGeneric(RootlyGenericApiError),
}

impl Error for RootlyError {}

impl std::fmt::Display for RootlyError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(e) => write!(f, "RootlyClientError: {:?}", e),
      Self::ApiSpecific(e) => write!(f, "RootlySpecificApiError: {:?}", e),
      Self::ApiGeneric(e) => write!(f, "RootlyGenericApiError: {:?}", e),
    }
  }
}

impl From<RootlyClientError> for RootlyError {
  fn from(error: RootlyClientError) -> Self {
    Self::Client(error)
  }
}

impl From<RootlySpecificApiError> for RootlyError {
  fn from(error: RootlySpecificApiError) -> Self {
    Self::ApiSpecific(error)
  }
}

impl From<RootlyGenericApiError> for RootlyError {
  fn from(error: RootlyGenericApiError) -> Self {
    Self::ApiGeneric(error)
  }
}
