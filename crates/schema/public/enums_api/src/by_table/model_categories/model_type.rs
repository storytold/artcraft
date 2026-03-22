use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `model_categories` table in an `ENUM` field.
/// (*WE WANT TO STOP USING ENUM FIELDS DUE TO MIGRATION ISSUES*)
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "lowercase")]

pub enum ModelType {
  Tts,
  W2l,
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
      assert_serialization(ModelType::W2l, "w2l");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("tts", ModelType::Tts);
      assert_deserialization("w2l", ModelType::W2l);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(ModelType::iter().count(), 2);
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
