use std::fmt;

use crate::error::gmicloud_client_error::GmiCloudClientError;
use crate::error::gmicloud_generic_api_error::GmiCloudGenericApiError;
use crate::error::gmicloud_specific_api_error::GmiCloudSpecificApiError;

/// Top-level error type for the GmiCloud client.
#[derive(Debug)]
pub enum GmiCloudError {
  Client(GmiCloudClientError),
  ApiSpecific(GmiCloudSpecificApiError),
  ApiGeneric(GmiCloudGenericApiError),
}

impl fmt::Display for GmiCloudError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl From<GmiCloudClientError> for GmiCloudError {
  fn from(err: GmiCloudClientError) -> Self {
    Self::Client(err)
  }
}

impl From<GmiCloudSpecificApiError> for GmiCloudError {
  fn from(err: GmiCloudSpecificApiError) -> Self {
    Self::ApiSpecific(err)
  }
}

impl From<GmiCloudGenericApiError> for GmiCloudError {
  fn from(err: GmiCloudGenericApiError) -> Self {
    Self::ApiGeneric(err)
  }
}
