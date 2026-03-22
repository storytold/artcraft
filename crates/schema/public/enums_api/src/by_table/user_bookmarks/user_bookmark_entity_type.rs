use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `user_bookmarks` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum UserBookmarkEntityType {
    /// User
    #[serde(rename = "user")]
    User,

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

    /// MediaFile
    #[serde(rename = "media_file")]
    MediaFile,

    /// ModelWeight (the new way to store models)
    #[serde(rename = "model_weight")]
    ModelWeight,

    /// VoiceConversionModel
    #[serde(rename = "voice_conversion_model")]
    VoiceConversionModel,

    /// ZsVoice
    #[serde(rename = "zs_voice")]
    ZsVoice,
}

#[cfg(test)]
mod tests {
  use super::UserBookmarkEntityType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(UserBookmarkEntityType::User, "user");
      assert_serialization(UserBookmarkEntityType::TtsModel, "tts_model");
      assert_serialization(UserBookmarkEntityType::TtsResult, "tts_result");
      assert_serialization(UserBookmarkEntityType::W2lTemplate, "w2l_template");
      assert_serialization(UserBookmarkEntityType::W2lResult, "w2l_result");
      assert_serialization(UserBookmarkEntityType::MediaFile, "media_file");
      assert_serialization(UserBookmarkEntityType::ModelWeight, "model_weight");
      assert_serialization(UserBookmarkEntityType::VoiceConversionModel, "voice_conversion_model");
      assert_serialization(UserBookmarkEntityType::ZsVoice, "zs_voice");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("user", UserBookmarkEntityType::User);
      assert_deserialization("tts_model", UserBookmarkEntityType::TtsModel);
      assert_deserialization("tts_result", UserBookmarkEntityType::TtsResult);
      assert_deserialization("w2l_template", UserBookmarkEntityType::W2lTemplate);
      assert_deserialization("w2l_result", UserBookmarkEntityType::W2lResult);
      assert_deserialization("media_file", UserBookmarkEntityType::MediaFile);
      assert_deserialization("model_weight", UserBookmarkEntityType::ModelWeight);
      assert_deserialization("voice_conversion_model", UserBookmarkEntityType::VoiceConversionModel);
      assert_deserialization("zs_voice", UserBookmarkEntityType::ZsVoice);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(UserBookmarkEntityType::iter().count(), 9);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in UserBookmarkEntityType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: UserBookmarkEntityType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
