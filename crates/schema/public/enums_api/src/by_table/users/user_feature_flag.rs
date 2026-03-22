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
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(UserFeatureFlag::ExploreMedia, "explore_media");
      assert_serialization(UserFeatureFlag::Studio, "studio");
      assert_serialization(UserFeatureFlag::Upload3d, "upload_3d");
      assert_serialization(UserFeatureFlag::VideoStyleTransfer, "video_style_transfer");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("explore_media", UserFeatureFlag::ExploreMedia);
      assert_deserialization("studio", UserFeatureFlag::Studio);
      assert_deserialization("upload_3d", UserFeatureFlag::Upload3d);
      assert_deserialization("video_style_transfer", UserFeatureFlag::VideoStyleTransfer);
    }

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
