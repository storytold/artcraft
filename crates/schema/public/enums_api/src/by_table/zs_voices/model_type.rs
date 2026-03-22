use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `zs_voices` table in a `VARCHAR(16)` field named `model_type`.
///
/// This indicates what type of features are used in the embeddings.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum ZsVoiceModelType {
  /// TTS-type zero shot models
  #[serde(rename = "vall-e-x")]
  VallEX,
  #[serde(rename = "styletts2")]
  StyleTTS2,
}

#[cfg(test)]
mod tests {
  use super::ZsVoiceModelType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ZsVoiceModelType::VallEX, "vall-e-x");
      assert_serialization(ZsVoiceModelType::StyleTTS2, "styletts2");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("vall-e-x", ZsVoiceModelType::VallEX);
      assert_deserialization("styletts2", ZsVoiceModelType::StyleTTS2);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(ZsVoiceModelType::iter().count(), 2);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in ZsVoiceModelType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: ZsVoiceModelType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
