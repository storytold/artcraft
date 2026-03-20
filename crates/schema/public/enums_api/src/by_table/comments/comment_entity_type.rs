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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
