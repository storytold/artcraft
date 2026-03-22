use enums_db::by_table::tag_uses::tag_use_entity_type::TagUseEntityType;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;

// TODO(bt, 2024-01-16): A ref type with <'a> lifetime of inner data instead of ownership?
pub enum TagUseEntity {
  MediaFile(MediaFileToken),
  ModelWeight(ModelWeightToken),
}

// TODO(bt, 2024-01-16): Codegen? Make traits for these? Maybe overkill.
impl TagUseEntity {
  pub fn from_entity_type_and_token(entity_type: TagUseEntityType, token: &str) -> Self {
    match entity_type {
      TagUseEntityType::ModelWeight => Self::ModelWeight(ModelWeightToken::new_from_str(token)),
      TagUseEntityType::MediaFile => Self::MediaFile(MediaFileToken::new_from_str(token)),
    }
  }

  pub fn get_entity_type(&self) -> TagUseEntityType {
    match self {
      Self::MediaFile(_) => TagUseEntityType::MediaFile,
      Self::ModelWeight(_) => TagUseEntityType::ModelWeight,
    }
  }

  pub fn get_entity_token_str(&self) -> &str {
    match self {
      Self::MediaFile(token) => token.as_str(),
      Self::ModelWeight(token) => token.as_str(),
    }
  }

  pub fn get_composite_keys(&self) -> (TagUseEntityType, &str) {
    match self {
      Self::MediaFile(token) => (TagUseEntityType::MediaFile, token.as_str()),
      Self::ModelWeight(token) => (TagUseEntityType::ModelWeight, token.as_str()),
    }
  }
}
