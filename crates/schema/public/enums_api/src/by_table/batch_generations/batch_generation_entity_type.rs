use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `batch_generations` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, Ord, PartialOrd, ToSchema, EnumIter, Debug)]

pub enum BatchGenerationEntityType {
  /// Media files
  /// This will probably be the only type supported, but we'll leave the possibility of future types.
  #[serde(rename = "media_file")]
  MediaFile,
}

#[cfg(test)]
mod tests {
  use super::BatchGenerationEntityType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(BatchGenerationEntityType::MediaFile, "media_file");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("media_file", BatchGenerationEntityType::MediaFile);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(BatchGenerationEntityType::iter().count(), 1);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in BatchGenerationEntityType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: BatchGenerationEntityType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
