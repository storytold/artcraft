use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `trending_model_analytics` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "lowercase")]

pub enum ModelType {
  /// TTS models
  Tts,

  // NB: It's assumed we'll use this same system to track
  // trending VC models too, so the next type would be "VC".
}

#[cfg(test)]
mod tests {
  use super::ModelType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ModelType::Tts, "tts");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("tts", ModelType::Tts);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(ModelType::iter().count(), 1);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in ModelType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: ModelType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
