use crate::error::world_labs_client_error::WorldLabsClientError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use crate::error::world_labs_specific_api_error::WorldLabsSpecificApiError;
use std::error::Error;

#[derive(Debug)]
pub enum WorldLabsError {
  Client(WorldLabsClientError),
  ApiSpecific(WorldLabsSpecificApiError),
  ApiGeneric(WorldLabsGenericApiError),
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
