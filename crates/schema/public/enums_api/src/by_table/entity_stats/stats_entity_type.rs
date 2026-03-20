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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
