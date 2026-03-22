use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `comments` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

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

#[cfg(test)]
mod tests {
  use super::CommentEntityType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
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

    #[test]
    fn test_deserialization() {
      assert_deserialization("user", CommentEntityType::User);
      assert_deserialization("media_file", CommentEntityType::MediaFile);
      assert_deserialization("model_weight", CommentEntityType::ModelWeight);
      assert_deserialization("tts_model", CommentEntityType::TtsModel);
      assert_deserialization("tts_result", CommentEntityType::TtsResult);
      assert_deserialization("w2l_template", CommentEntityType::W2lTemplate);
      assert_deserialization("w2l_result", CommentEntityType::W2lResult);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(CommentEntityType::iter().count(), 7);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in CommentEntityType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: CommentEntityType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
