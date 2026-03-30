use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use crate::characters::shared::CharacterDetails;

/// Query string parameters for listing characters.
#[derive(Deserialize, IntoParams)]
pub struct ListCharactersQuery {
  /// Optional cursor for pagination.
  pub cursor: Option<u64>,
}

/// Response body for listing characters in the current session.
#[derive(Serialize, ToSchema)]
pub struct ListCharactersResponse {
  pub success: bool,
  pub characters: Vec<CharacterDetails>,
  pub next_cursor: Option<u64>,
}
