use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

/// Query string parameters for the video models endpoint.
#[derive(Deserialize, IntoParams)]
pub struct OmniGenVideoModelsQuery {
  /// Which provider's models to list. Defaults to "artcraft" if absent.
  pub provider: Option<OmniGenModelsProvider>,
}

/// The provider filter for the models endpoint.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum OmniGenModelsProvider {
  /// Only models available through ArtCraft.
  Artcraft,
  /// All known models across all providers.
  All,
}

impl Default for OmniGenModelsProvider {
  fn default() -> Self {
    Self::Artcraft
  }
}

/// Response body for the video models endpoint.
/// TBD — fields will be added later.
#[derive(Serialize, ToSchema)]
pub struct OmniGenVideoModelsResponse {
  pub success: bool,
}
