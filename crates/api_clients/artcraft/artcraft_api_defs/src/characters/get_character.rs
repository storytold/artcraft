use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::common::responses::media_links::MediaLinks;
use enums::common::generation::common_model_type::CommonModelType;
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
  pub character: GetCharacterDetails,
}

/// Full character details returned by the get endpoint.
#[derive(Serialize, ToSchema)]
pub struct GetCharacterDetails {
  pub token: CharacterToken,

  /// Which models this character can be used with.
  pub models: Vec<CommonModelType>,

  pub name: String,

  pub maybe_description: Option<String>,

  pub maybe_avatar: Option<MediaLinks>,

  pub maybe_full_image: Option<MediaLinks>,
}
