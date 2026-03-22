use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `zs_voices` table in a `VARCHAR(16)` field named `model_category`.
///
/// This indicates what type of features are used in the embeddings.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum ZsVoiceModelCategory {
  /// TTS-type zero shot models
  #[serde(rename = "tts")]
  Tts,
}

#[cfg(test)]
mod tests {
  use super::ZsVoiceModelCategory;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ZsVoiceModelCategory::Tts, "tts");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("tts", ZsVoiceModelCategory::Tts);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(ZsVoiceModelCategory::iter().count(), 1);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in ZsVoiceModelCategory::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: ZsVoiceModelCategory = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
