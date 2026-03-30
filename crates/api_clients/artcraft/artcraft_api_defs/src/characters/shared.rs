use serde_derive::Serialize;
use utoipa::ToSchema;

use crate::common::responses::media_links::MediaLinks;
use enums::common::generation::common_model_type::CommonModelType;
use tokens::tokens::characters::CharacterToken;

/// Character summary used in list and get responses.
#[derive(Serialize, ToSchema)]
pub struct CharacterDetails {
  pub token: CharacterToken,

  /// Which models this character can be used with.
  pub models: Vec<CommonModelType>,

  pub name: String,

  pub maybe_description: Option<String>,

  pub maybe_avatar: Option<MediaLinks>,

  pub maybe_full_image: Option<MediaLinks>,
}
