use std::error::Error;
use std::fmt::{Display, Formatter};
use storyteller_client::error::storyteller_error::StorytellerError;

#[derive(Debug)]
pub enum ProviderError {
  Storyteller(StorytellerError),
}

impl Error for ProviderError {}

impl Display for ProviderError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Storyteller(e) => write!(f, "Storyteller provider error: {}", e),
    }
  }
}

impl From<StorytellerError> for ProviderError {
  fn from(error: StorytellerError) -> Self {
    Self::Storyteller(error)
  }
}
