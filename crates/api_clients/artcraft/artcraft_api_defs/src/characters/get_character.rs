use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::characters::shared::CharacterDetails;
use tokens::tokens::characters::CharacterToken;

/// Path parameters for getting a character.
#[derive(Deserialize, ToSchema)]
pub struct GetCharacterPathInfo {
  pub character_token: CharacterToken,
}

/// Response body for getting a character.
#[derive(Serialize, ToSchema)]
pub struct GetCharacterResponse {
  pub success: bool,
  pub character: CharacterDetails,
}
