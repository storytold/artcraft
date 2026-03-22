use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `user_ratings` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

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

#[cfg(test)]
mod tests {
  use super::UserRatingEntityType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
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

    #[test]
    fn test_deserialization() {
      assert_deserialization("media_file", UserRatingEntityType::MediaFile);
      assert_deserialization("model_weight", UserRatingEntityType::ModelWeight);
      assert_deserialization("tts_model", UserRatingEntityType::TtsModel);
      assert_deserialization("tts_result", UserRatingEntityType::TtsResult);
      assert_deserialization("w2l_template", UserRatingEntityType::W2lTemplate);
      assert_deserialization("w2l_result", UserRatingEntityType::W2lResult);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(UserRatingEntityType::iter().count(), 6);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in UserRatingEntityType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: UserRatingEntityType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
