use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::characters::CharacterToken;

/// Request body for editing a character.
#[derive(Deserialize, ToSchema)]
pub struct EditCharacterRequest {
  /// The character to edit.
  pub token: CharacterToken,

  /// Updated name (if changing).
  pub updated_name: Option<String>,

  /// Updated description (if changing).
  pub updated_description: Option<String>,
}

/// Response body for editing a character.
#[derive(Serialize, ToSchema)]
pub struct EditCharacterResponse {
  pub success: bool,
}
