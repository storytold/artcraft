use enums_db::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::tts_results::TtsResultToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::voice_conversion_models::VoiceConversionModelToken;
use tokens::tokens::w2l_results::W2lResultToken;
use tokens::tokens::w2l_templates::W2lTemplateToken;
use tokens::tokens::zs_voices::ZsVoiceToken;

// TODO(bt,2024-05-05): Make this a composite_identifier enum

pub enum UserBookmarkEntityToken {
  User(UserToken),
  ModelWeight(ModelWeightToken),
  TtsModel(TtsModelToken),
  TtsResult(TtsResultToken),
  W2lTemplate(W2lTemplateToken),
  W2lResult(W2lResultToken),
  MediaFile(MediaFileToken),
  VoiceConversionModel(VoiceConversionModelToken),
  ZsVoice(ZsVoiceToken),
}

impl UserBookmarkEntityToken {
  pub fn from_entity_type_and_token(entity_type: UserBookmarkEntityType, token: &str) -> Self {
    match entity_type {
      UserBookmarkEntityType::User => Self::User(UserToken::new_from_str(token)),
      UserBookmarkEntityType::ModelWeight => Self::ModelWeight(ModelWeightToken::new_from_str(token)),
      UserBookmarkEntityType::TtsModel => Self::TtsModel(TtsModelToken::new_from_str(token)),
      UserBookmarkEntityType::TtsResult => Self::TtsResult(TtsResultToken::new_from_str(token)),
      UserBookmarkEntityType::W2lTemplate => Self::W2lTemplate(W2lTemplateToken::new_from_str(token)),
      UserBookmarkEntityType::W2lResult => Self::W2lResult(W2lResultToken::new_from_str(token)),
      UserBookmarkEntityType::MediaFile => Self::MediaFile(MediaFileToken::new_from_str(token)),
      UserBookmarkEntityType::VoiceConversionModel => Self::VoiceConversionModel(VoiceConversionModelToken::new_from_str(token)),
      UserBookmarkEntityType::ZsVoice => Self::ZsVoice(ZsVoiceToken::new_from_str(token)),
    }
  }

  pub fn get_composite_keys(&self) -> (UserBookmarkEntityType, &str) {
    match self {
      UserBookmarkEntityToken::User(user_token) => (UserBookmarkEntityType::User, user_token.as_str()),
      UserBookmarkEntityToken::ModelWeight(model_weight_token) => (UserBookmarkEntityType::ModelWeight, model_weight_token.as_str()),
      UserBookmarkEntityToken::TtsModel(tts_model_token) => (UserBookmarkEntityType::TtsModel, tts_model_token.as_str()),
      UserBookmarkEntityToken::TtsResult(tts_result_token) => (UserBookmarkEntityType::TtsResult, tts_result_token.as_str()),
      UserBookmarkEntityToken::W2lTemplate(w2l_template_token) => (UserBookmarkEntityType::W2lTemplate, w2l_template_token.as_str()),
      UserBookmarkEntityToken::W2lResult(w2l_result_token) => (UserBookmarkEntityType::W2lResult, w2l_result_token.as_str()),
      UserBookmarkEntityToken::MediaFile(media_file_token) => (UserBookmarkEntityType::MediaFile, media_file_token.as_str()),
      UserBookmarkEntityToken::VoiceConversionModel(voice_conversion_model_token) => (UserBookmarkEntityType::VoiceConversionModel, voice_conversion_model_token.as_str()),
      UserBookmarkEntityToken::ZsVoice(zs_voice_token) => (UserBookmarkEntityType::ZsVoice, zs_voice_token.as_str()),
    }
  }
}
