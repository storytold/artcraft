use enums_db::by_table::comments::comment_entity_type::CommentEntityType;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::w2l_templates::W2lTemplateToken;

pub enum CommentEntityToken {
  User(UserToken),
  MediaFile(MediaFileToken),
  ModelWeight(ModelWeightToken),
  TtsModel(TtsModelToken),
  TtsResult(String), // TODO: Strong type
  W2lTemplate(W2lTemplateToken),
  W2lResult(String), // TODO: Strong type
}

impl CommentEntityToken {

  pub fn from_entity_type_and_token(entity_type: CommentEntityType, token: &str) -> Self {
    match entity_type {
      CommentEntityType::User => Self::User(UserToken::new_from_str(token)),
      CommentEntityType::TtsModel => Self::TtsModel(TtsModelToken::new_from_str(token)),
      CommentEntityType::TtsResult => Self::TtsResult(token.to_string()),
      CommentEntityType::W2lTemplate => Self::W2lTemplate(W2lTemplateToken::new_from_str(token)),
      CommentEntityType::W2lResult => Self::W2lResult(token.to_string()),
      CommentEntityType::MediaFile => Self::MediaFile(MediaFileToken::new_from_str(token)),
      CommentEntityType::ModelWeight => Self::ModelWeight(ModelWeightToken::new_from_str(token)),
    }
  }

  pub fn get_composite_keys(&self) -> (CommentEntityType, &str) {
    let (entity_type, entity_token) = match self {
      CommentEntityToken::User(user_token) => (CommentEntityType::User, user_token.as_str()),
      CommentEntityToken::TtsModel(tts_model_token) => (CommentEntityType::TtsModel, tts_model_token.as_str()),
      CommentEntityToken::TtsResult(tts_result_token) => (CommentEntityType::TtsResult, tts_result_token.as_str()),
      CommentEntityToken::W2lTemplate(w2l_template_token) => (CommentEntityType::W2lTemplate, w2l_template_token.as_str()),
      CommentEntityToken::W2lResult(w2l_result_token) => (CommentEntityType::W2lResult, w2l_result_token.as_str()),
      CommentEntityToken::MediaFile(media_file_token) => (CommentEntityType::MediaFile, media_file_token.as_str()),
      CommentEntityToken::ModelWeight(model_weight_token) => (CommentEntityType::ModelWeight, model_weight_token.as_str()),
    };
    (entity_type, entity_token)
  }
}
