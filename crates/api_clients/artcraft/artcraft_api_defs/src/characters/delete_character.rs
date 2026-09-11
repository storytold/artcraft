use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::characters::CharacterToken;

/// Path parameters for deleting a character.
#[derive(Deserialize, ToSchema)]
pub struct DeleteCharacterPathInfo {
  pub character_token: CharacterToken,
}

/// Response body for deleting a character.
#[derive(Serialize, ToSchema)]
pub struct DeleteCharacterResponse {
  pub success: bool,
}
