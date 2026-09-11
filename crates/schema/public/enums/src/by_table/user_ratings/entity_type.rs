use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `user_ratings` table in a `VARCHAR(32)` field named `entity_type`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema)]
pub enum UserRatingEntityType {
  /// Media files (inference results, uploads, etc.)
  #[serde(rename = "media_file")]
  MediaFile,

  /// Model weights (modern, polymorphic, type agnostic)
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
impl_enum_display_and_debug_using_to_str!(UserRatingEntityType);
impl_mysql_enum_coders!(UserRatingEntityType);

/// NB: Legacy API for older code.
impl UserRatingEntityType {
  pub fn to_str(&self) -> &'static str {
    match self {
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
  use crate::by_table::user_ratings::entity_type::UserRatingEntityType;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(UserRatingEntityType::MediaFile, "media_file");
      assert_serialization(UserRatingEntityType::ModelWeight, "model_weight");
      assert_serialization(UserRatingEntityType::TtsModel, "tts_model");
      assert_serialization(UserRatingEntityType::TtsResult, "tts_result");
      assert_serialization(UserRatingEntityType::W2lTemplate, "w2l_template");
      assert_serialization(UserRatingEntityType::W2lResult, "w2l_result");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(UserRatingEntityType::MediaFile.to_str(), "media_file");
      assert_eq!(UserRatingEntityType::ModelWeight.to_str(), "model_weight");
      assert_eq!(UserRatingEntityType::TtsModel.to_str(), "tts_model");
      assert_eq!(UserRatingEntityType::TtsResult.to_str(), "tts_result");
      assert_eq!(UserRatingEntityType::W2lTemplate.to_str(), "w2l_template");
      assert_eq!(UserRatingEntityType::W2lResult.to_str(), "w2l_result");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(UserRatingEntityType::from_str("media_file").unwrap(), UserRatingEntityType::MediaFile);
      assert_eq!(UserRatingEntityType::from_str("model_weight").unwrap(), UserRatingEntityType::ModelWeight);
      assert_eq!(UserRatingEntityType::from_str("tts_model").unwrap(), UserRatingEntityType::TtsModel);
      assert_eq!(UserRatingEntityType::from_str("tts_result").unwrap(), UserRatingEntityType::TtsResult);
      assert_eq!(UserRatingEntityType::from_str("w2l_template").unwrap(), UserRatingEntityType::W2lTemplate);
      assert_eq!(UserRatingEntityType::from_str("w2l_result").unwrap(), UserRatingEntityType::W2lResult);
      assert!(UserRatingEntityType::from_str("foo").is_err());
    }
  }
}
