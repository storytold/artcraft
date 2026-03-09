use crate::error::world_labs_client_error::WorldLabsClientError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use crate::error::world_labs_specific_api_error::WorldLabsSpecificApiError;
use cloudflare_errors::cloudflare_error::CloudflareError;
use std::error::Error;

#[derive(Debug)]
pub enum WorldLabsError {
  Client(WorldLabsClientError),
  ApiSpecific(WorldLabsSpecificApiError),
  ApiGeneric(WorldLabsGenericApiError),
}

impl WorldLabsError {
  pub fn is_world_labs_having_downtime_issues(&self) -> bool {
    match self {
      Self::ApiGeneric(WorldLabsGenericApiError::CloudflareError(CloudflareError::BadGateway502)) => true,
      Self::ApiGeneric(WorldLabsGenericApiError::CloudflareError(CloudflareError::GatewayTimeout504)) => true,
      Self::ApiGeneric(WorldLabsGenericApiError::CloudflareError(CloudflareError::TimeoutOccurred524)) => true,
      _ => false,
    }
  }
}

impl Error for WorldLabsError {}

impl std::fmt::Display for WorldLabsError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(e) => write!(f, "WorldLabsClientError: {:?}", e),
      Self::ApiSpecific(e) => write!(f, "WorldLabsSpecificApiError: {:?}", e),
      Self::ApiGeneric(e) => write!(f, "WorldLabsGenericApiError: {:?}", e),
    }
  }
}

impl From<WorldLabsClientError> for WorldLabsError {
  fn from(error: WorldLabsClientError) -> Self {
    Self::Client(error)
  }
}

impl From<WorldLabsSpecificApiError> for WorldLabsError {
  fn from(error: WorldLabsSpecificApiError) -> Self {
    Self::ApiSpecific(error)
  }
}

impl From<WorldLabsGenericApiError> for WorldLabsError {
  fn from(error: WorldLabsGenericApiError) -> Self {
    Self::ApiGeneric(error)
  }
}

impl From<CloudflareError> for WorldLabsError {
  fn from(error: CloudflareError) -> Self {
    Self::ApiGeneric(WorldLabsGenericApiError::CloudflareError(error))
  }
}
