use strum::EnumCount;
use strum::EnumIter;

/// Used in the `users` table in a `VARCHAR` field (stored as comma separated set).
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(UserFeatureFlag);
impl_mysql_enum_coders!(UserFeatureFlag);
impl_mysql_from_row!(UserFeatureFlag);

/// NB: Legacy API for older code.
impl UserFeatureFlag {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::ExploreMedia => "explore_media",
      Self::Studio => "studio",
      Self::Upload3d => "upload_3d",
      Self::VideoStyleTransfer => "video_style_transfer",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "explore_media" => Ok(Self::ExploreMedia),
      "studio" => Ok(Self::Studio),
      "upload_3d" => Ok(Self::Upload3d),
      "video_style_transfer" => Ok(Self::VideoStyleTransfer),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::user_feature_flag::UserFeatureFlag;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(UserFeatureFlag::ExploreMedia, "explore_media");
      assert_serialization(UserFeatureFlag::Studio, "studio");
      assert_serialization(UserFeatureFlag::Upload3d, "upload_3d");
      assert_serialization(UserFeatureFlag::VideoStyleTransfer, "video_style_transfer");
    }

    #[test]
    fn test_to_str() {
      assert_eq!(UserFeatureFlag::ExploreMedia.to_str(), "explore_media");
      assert_eq!(UserFeatureFlag::Studio.to_str(), "studio");
      assert_eq!(UserFeatureFlag::Upload3d.to_str(), "upload_3d");
      assert_eq!(UserFeatureFlag::VideoStyleTransfer.to_str(), "video_style_transfer");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(UserFeatureFlag::from_str("explore_media").unwrap(), UserFeatureFlag::ExploreMedia);
      assert_eq!(UserFeatureFlag::from_str("studio").unwrap(), UserFeatureFlag::Studio);
      assert_eq!(UserFeatureFlag::from_str("upload_3d").unwrap(), UserFeatureFlag::Upload3d);
      assert_eq!(UserFeatureFlag::from_str("video_style_transfer").unwrap(), UserFeatureFlag::VideoStyleTransfer);
      assert!(UserFeatureFlag::from_str("foo").is_err());
    }

  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in UserFeatureFlag::iter() {
        assert_eq!(variant, UserFeatureFlag::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, UserFeatureFlag::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, UserFeatureFlag::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 32;
      for variant in UserFeatureFlag::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
