use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `users` table in a `VARCHAR` field (stored as comma separated set).
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]

pub enum UserFeatureFlag {
  /// Grants a user the ability to list media
  /// (For now, it's hidden until we get an NSFW filter.)
  ExploreMedia,

  /// Access to studio features
  Studio,

  /// Whether users are allowed to upload 3D models
  #[serde(rename = "upload_3d")]
  Upload3d,

  /// Access to video style transfer
  VideoStyleTransfer,
}

#[cfg(test)]
mod tests {
  use super::UserFeatureFlag;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(UserFeatureFlag::iter().count(), 4);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in UserFeatureFlag::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: UserFeatureFlag = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
