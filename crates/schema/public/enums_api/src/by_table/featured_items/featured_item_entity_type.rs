use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `user_bookmarks` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum FeaturedItemEntityType {
    /// MediaFile
    #[serde(rename = "media_file")]
    MediaFile,

    /// ModelWeight (the new way to store models)
    #[serde(rename = "model_weight")]
    ModelWeight,

    /// User
    #[serde(rename = "user")]
    User,
}

#[cfg(test)]
mod tests {
  use super::FeaturedItemEntityType;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(FeaturedItemEntityType::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in FeaturedItemEntityType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: FeaturedItemEntityType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
