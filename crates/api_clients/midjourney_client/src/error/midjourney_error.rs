use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use std::error::Error;

#[derive(Debug)]
pub enum MidjourneyError {
  Api(MidjourneyApiError),
  Client(MidjourneyClientError),
}

impl Error for MidjourneyError {}

impl std::fmt::Display for MidjourneyError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Api(e) => write!(f, "Midjourney API error: {:?}", e),
      Self::Client(e) => write!(f, "Midjourney Client error: {:?}", e),
    }
  }
}

impl From<MidjourneyApiError> for MidjourneyError {
  fn from(error: MidjourneyApiError) -> Self {
    Self::Api(error)
  }
}

impl From<MidjourneyClientError> for MidjourneyError {
  fn from(error: MidjourneyClientError) -> Self {
    Self::Client(error)
  }
}
