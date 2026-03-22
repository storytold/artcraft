use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `user_stats` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, Ord, PartialOrd, EnumIter, Debug)]

pub enum StatsEntityType {
    /// Comment
    #[serde(rename = "comment")]
    Comment,
    
    /// MediaFile
    #[serde(rename = "media_file")]
    MediaFile,

    /// ModelWeight (the new way to store models)
    #[serde(rename = "model_weight")]
    ModelWeight,
}

#[cfg(test)]
mod tests {
  use super::StatsEntityType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(StatsEntityType::Comment, "comment");
      assert_serialization(StatsEntityType::MediaFile, "media_file");
      assert_serialization(StatsEntityType::ModelWeight, "model_weight");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("comment", StatsEntityType::Comment);
      assert_deserialization("media_file", StatsEntityType::MediaFile);
      assert_deserialization("model_weight", StatsEntityType::ModelWeight);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(StatsEntityType::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in StatsEntityType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: StatsEntityType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
