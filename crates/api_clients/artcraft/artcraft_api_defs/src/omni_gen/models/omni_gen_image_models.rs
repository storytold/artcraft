use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

/// Query string parameters for the image models endpoint.
#[derive(Deserialize, IntoParams)]
pub struct OmniGenImageModelsQuery {
  /// Which provider's models to list. Defaults to "artcraft" if absent.
  pub provider: Option<OmniGenImageModelsProvider>,
}

/// The provider filter for the models endpoint.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum OmniGenImageModelsProvider {
  /// Only models available through ArtCraft.
  Artcraft,
  /// All known models across all providers.
  All,
}

impl Default for OmniGenImageModelsProvider {
  fn default() -> Self {
    Self::Artcraft
  }
}

/// Response body for the image models endpoint.
/// TBD — fields will be added later.
#[derive(Serialize, ToSchema)]
pub struct OmniGenImageModelsResponse {
  pub success: bool,
}
