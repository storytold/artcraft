use enums_db::by_table::user_ratings::entity_type::UserRatingEntityType;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::w2l_templates::W2lTemplateToken;

// TODO: A ref type with <'a> lifetime of inner data instead of ownership?
/// Implicitly encodes both the type of token and the token value.
/// This is because we use a "type" column in the database, which forms a composite key.
///
/// Having a summation type here makes using the DB library more strongly typed
/// and more polymorphic.
///
/// NB: We probably don't want to expose this type of interface to web clients because it's
/// monotonous as a JSON interface.
pub enum UserRatingEntity {
  MediaFile(MediaFileToken),
  ModelWeight(ModelWeightToken),
  TtsModel(TtsModelToken),
  W2lTemplate(W2lTemplateToken),
}

// TODO: Make traits for these? Maybe overkill.
impl UserRatingEntity {
  pub fn get_entity_type(&self) -> UserRatingEntityType {
    match self {
      UserRatingEntity::MediaFile(_) => UserRatingEntityType::MediaFile,
      UserRatingEntity::ModelWeight(_) => UserRatingEntityType::ModelWeight,
      UserRatingEntity::TtsModel(_) => UserRatingEntityType::TtsModel,
      UserRatingEntity::W2lTemplate(_) => UserRatingEntityType::W2lTemplate,
    }
  }

  pub fn get_entity_token_str(&self) -> &str {
    match self {
      UserRatingEntity::MediaFile(token) => token.as_str(),
      UserRatingEntity::ModelWeight(token) => token.as_str(),
      UserRatingEntity::TtsModel(token) => token.as_str(),
      UserRatingEntity::W2lTemplate(token) => token.as_str(),
    }
  }

  pub fn get_composite_keys(&self) -> (UserRatingEntityType, &str) {
    match self {
      UserRatingEntity::MediaFile(token) => (UserRatingEntityType::MediaFile, token.as_str()),
      UserRatingEntity::ModelWeight(token) => (UserRatingEntityType::ModelWeight, token.as_str()),
      UserRatingEntity::TtsModel(token) => (UserRatingEntityType::TtsModel, token.as_str()),
      UserRatingEntity::W2lTemplate(token) => (UserRatingEntityType::W2lTemplate, token.as_str()),
    }
  }
}
