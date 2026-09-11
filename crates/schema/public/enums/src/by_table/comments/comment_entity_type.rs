use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `comments` table in a `VARCHAR(32)` field named `entity_type`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema)]
pub enum CommentEntityType {
  /// User
  #[serde(rename = "user")]
  User,

  /// Media files
  #[serde(rename = "media_file")]
  MediaFile,

  /// Model weights
  #[serde(rename = "model_weight")]
  ModelWeight,

  /// TTS model (architecture does not matter)
  #[serde(rename = "tts_model")]
  TtsModel,

  /// TTS result (architecture does not matter)
  #[serde(rename = "tts_result")]
  TtsResult,

  /// W2L template
  #[serde(rename = "w2l_template")]
  W2lTemplate,

  /// W2L result
  #[serde(rename = "w2l_result")]
  W2lResult,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(CommentEntityType);
impl_mysql_enum_coders!(CommentEntityType);

/// NB: Legacy API for older code.
impl CommentEntityType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::User => "user",
      Self::MediaFile => "media_file",
      Self::ModelWeight => "model_weight",
      Self::TtsModel => "tts_model",
      Self::TtsResult => "tts_result",
      Self::W2lTemplate => "w2l_template",
      Self::W2lResult => "w2l_result",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "user" => Ok(Self::User),
      "media_file" => Ok(Self::MediaFile),
      "model_weight" => Ok(Self::ModelWeight),
      "tts_model" => Ok(Self::TtsModel),
      "tts_result" => Ok(Self::TtsResult),
      "w2l_template" => Ok(Self::W2lTemplate),
      "w2l_result" => Ok(Self::W2lResult),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::comments::comment_entity_type::CommentEntityType;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(CommentEntityType::User, "user");
      assert_serialization(CommentEntityType::MediaFile, "media_file");
      assert_serialization(CommentEntityType::ModelWeight, "model_weight");
      assert_serialization(CommentEntityType::TtsModel, "tts_model");
      assert_serialization(CommentEntityType::TtsResult, "tts_result");
      assert_serialization(CommentEntityType::W2lTemplate, "w2l_template");
      assert_serialization(CommentEntityType::W2lResult, "w2l_result");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(CommentEntityType::User.to_str(), "user");
      assert_eq!(CommentEntityType::MediaFile.to_str(), "media_file");
      assert_eq!(CommentEntityType::ModelWeight.to_str(), "model_weight");
      assert_eq!(CommentEntityType::TtsModel.to_str(), "tts_model");
      assert_eq!(CommentEntityType::TtsResult.to_str(), "tts_result");
      assert_eq!(CommentEntityType::W2lTemplate.to_str(), "w2l_template");
      assert_eq!(CommentEntityType::W2lResult.to_str(), "w2l_result");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(CommentEntityType::from_str("user").unwrap(), CommentEntityType::User);
      assert_eq!(CommentEntityType::from_str("media_file").unwrap(), CommentEntityType::MediaFile);
      assert_eq!(CommentEntityType::from_str("model_weight").unwrap(), CommentEntityType::ModelWeight);
      assert_eq!(CommentEntityType::from_str("tts_model").unwrap(), CommentEntityType::TtsModel);
      assert_eq!(CommentEntityType::from_str("tts_result").unwrap(), CommentEntityType::TtsResult);
      assert_eq!(CommentEntityType::from_str("w2l_template").unwrap(), CommentEntityType::W2lTemplate);
      assert_eq!(CommentEntityType::from_str("w2l_result").unwrap(), CommentEntityType::W2lResult);
      assert!(CommentEntityType::from_str("foo").is_err());
    }
  }
}
