use std::error::Error;
use std::fmt::{Display, Formatter};
use artcraft_client::error::storyteller_error::StorytellerError;
use fal_client::error::fal_error_plus::FalErrorPlus;
use muapi_client::error::muapi_error::MuapiError;
use seedance2pro::error::seedance2pro_error::Seedance2ProError;

#[derive(Debug)]
pub enum ProviderError {
  Storyteller(StorytellerError),
  Fal(FalErrorPlus),
  Muapi(MuapiError),
  Seedance2Pro(Seedance2ProError),
}

impl Error for ProviderError {}

impl Display for ProviderError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Storyteller(e) => write!(f, "Storyteller provider error: {}", e),
      Self::Fal(e) => write!(f, "Fal provider error: {}", e),
      Self::Muapi(e) => write!(f, "Muapi provider error: {}", e),
      Self::Seedance2Pro(e) => write!(f, "Seedance2Pro provider error: {}", e),
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

impl From<MuapiError> for ProviderError {
  fn from(error: MuapiError) -> Self {
    Self::Muapi(error)
  }
}

impl From<Seedance2ProError> for ProviderError {
  fn from(error: Seedance2ProError) -> Self {
    Self::Seedance2Pro(error)
  }
}
