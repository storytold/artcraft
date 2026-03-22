use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `usages` table in a `VARCHAR(16)` field. (Two fields!)
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]

pub enum UsagesType {
  /// Represents a foreign key link against a model_weights record
  ModelWeight,

  /// Represents a foreign key link against a media_files record
  MediaFile,
}

#[cfg(test)]
mod tests {
  use super::UsagesType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(UsagesType::ModelWeight, "model_weight");
      assert_serialization(UsagesType::MediaFile, "media_file");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("model_weight", UsagesType::ModelWeight);
      assert_deserialization("media_file", UsagesType::MediaFile);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(UsagesType::iter().count(), 2);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in UsagesType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: UsagesType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
