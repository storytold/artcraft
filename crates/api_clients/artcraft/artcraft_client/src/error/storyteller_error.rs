use crate::error::api_error::ApiError;
use crate::error::client_error::ClientError;
use std::error::Error;

#[derive(Debug)]
pub enum StorytellerError {
  Api(ApiError),
  Client(ClientError),
}

impl Error for StorytellerError {}

impl std::fmt::Display for StorytellerError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      StorytellerError::Api(e) => write!(f, "Storyteller API error: {:?}", e),
      StorytellerError::Client(e) => write!(f, "Storyteller Client error: {:?}", e),
    }
  }
}

impl From<ApiError> for StorytellerError {
  fn from(error: ApiError) -> Self {
    StorytellerError::Api(error)
  }
}

impl From<ClientError> for StorytellerError {
  fn from(error: ClientError) -> Self {
    StorytellerError::Client(error)
  }
}
