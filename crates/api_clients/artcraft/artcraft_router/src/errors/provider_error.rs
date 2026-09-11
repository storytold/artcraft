use std::error::Error;
use std::fmt::{Display, Formatter};
use artcraft_client::error::storyteller_error::StorytellerError;
use fal_client::error::fal_error_plus::FalErrorPlus;
use gmicloud_client::error::gmicloud_error::GmiCloudError;
use grok_api_client::error::grok_error::GrokError;
use kinovi_web_client::error::kinovi_web_error::KinoviWebError;
use worldlabs_api_client::error::world_labs_error::WorldLabsError;

#[derive(Debug)]
pub enum ProviderError {
  Storyteller(StorytellerError),
  Fal(FalErrorPlus),
  GmiCloud(GmiCloudError),
  Grok(GrokError),
  KinoviWeb(KinoviWebError),
  WorldLabs(WorldLabsError),
}

impl Error for ProviderError {}

impl Display for ProviderError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Storyteller(e) => write!(f, "Storyteller provider error: {}", e),
      Self::Fal(e) => write!(f, "Fal provider error: {}", e),
      Self::GmiCloud(e) => write!(f, "GmiCloud provider error: {}", e),
      Self::Grok(e) => write!(f, "Grok provider error: {}", e),
      Self::KinoviWeb(e) => write!(f, "KinoviWeb provider error: {}", e),
      Self::WorldLabs(e) => write!(f, "WorldLabs provider error: {}", e),
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

impl From<GmiCloudError> for ProviderError {
  fn from(error: GmiCloudError) -> Self {
    Self::GmiCloud(error)
  }
}

impl From<GrokError> for ProviderError {
  fn from(error: GrokError) -> Self {
    Self::Grok(error)
  }
}

impl From<KinoviWebError> for ProviderError {
  fn from(error: KinoviWebError) -> Self {
    Self::KinoviWeb(error)
  }
}

impl From<WorldLabsError> for ProviderError {
  fn from(error: WorldLabsError) -> Self {
    Self::WorldLabs(error)
  }
}
