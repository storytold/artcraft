use enums_db::by_table::featured_items::featured_item_entity_type::FeaturedItemEntityType;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

// TODO(bt, 2024-01-16): A ref type with <'a> lifetime of inner data instead of ownership?
pub enum FeaturedItemEntity {
  MediaFile(MediaFileToken),
  ModelWeight(ModelWeightToken),
  User(UserToken),
}

// TODO(bt, 2024-01-16): Codegen? Make traits for these? Maybe overkill.
impl FeaturedItemEntity {

  pub fn from_entity_type_and_token(entity_type: FeaturedItemEntityType, token: &str) -> Self {
    match entity_type {
      FeaturedItemEntityType::ModelWeight => Self::ModelWeight(ModelWeightToken::new_from_str(token)),
      FeaturedItemEntityType::MediaFile => Self::MediaFile(MediaFileToken::new_from_str(token)),
      FeaturedItemEntityType::User => Self::User(UserToken::new_from_str(token)),
    }
  }

  pub fn get_entity_type(&self) -> FeaturedItemEntityType {
    match self {
      Self::MediaFile(_) => FeaturedItemEntityType::MediaFile,
      Self::ModelWeight(_) => FeaturedItemEntityType::ModelWeight,
      Self::User(_) => FeaturedItemEntityType::User,
    }
  }

  pub fn get_entity_token_str(&self) -> &str {
    match self {
      Self::MediaFile(token) => token.as_str(),
      Self::ModelWeight(token) => token.as_str(),
      Self::User(token) => token.as_str(),
    }
  }

  pub fn get_composite_keys(&self) -> (FeaturedItemEntityType, &str) {
    match self {
      Self::MediaFile(token) => (FeaturedItemEntityType::MediaFile, token.as_str()),
      Self::ModelWeight(token) => (FeaturedItemEntityType::ModelWeight, token.as_str()),
      Self::User(token) => (FeaturedItemEntityType::User, token.as_str()),
    }
  }
}
