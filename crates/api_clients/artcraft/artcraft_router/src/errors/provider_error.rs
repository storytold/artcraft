use std::error::Error;
use std::fmt::{Display, Formatter};
use artcraft_client::error::storyteller_error::StorytellerError;
use fal_client::error::fal_error_plus::FalErrorPlus;

#[derive(Debug)]
pub enum ProviderError {
  Storyteller(StorytellerError),
  Fal(FalErrorPlus),
}

impl Error for ProviderError {}

impl Display for ProviderError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Storyteller(e) => write!(f, "Storyteller provider error: {}", e),
      Self::Fal(e) => write!(f, "Fal provider error: {}", e),
    }
  }
}

impl From<StorytellerError> for ProviderError {
  fn from(error: StorytellerError) -> Self {
    Self::Storyteller(error)
  }
}

impl From<FalErrorPlus> for ProviderError {
  fn from(error: FalErrorPlus) -> Self {
    Self::Fal(error)
  }
}
