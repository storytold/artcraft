use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `tag_uses` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum TagUseEntityType {
  /// Media files
  #[serde(rename = "media_file")]
  MediaFile,

  /// Model weights
  #[serde(rename = "model_weight")]
  ModelWeight,
}

#[cfg(test)]
mod tests {
  use super::TagUseEntityType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(TagUseEntityType::MediaFile, "media_file");
      assert_serialization(TagUseEntityType::ModelWeight, "model_weight");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("media_file", TagUseEntityType::MediaFile);
      assert_deserialization("model_weight", TagUseEntityType::ModelWeight);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(TagUseEntityType::iter().count(), 2);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in TagUseEntityType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: TagUseEntityType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
