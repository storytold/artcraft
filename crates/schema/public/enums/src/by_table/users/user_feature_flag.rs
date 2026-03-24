use std::collections::BTreeSet;

use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `users` table in a `VARCHAR` field (stored as comma separated set).
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
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

  /// Access to the faster Seedance 2.0 whitelist
  #[serde(rename = "sd_wl")]
  SeedanceWhitelist,
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
      Self::SeedanceWhitelist => "sd_wl",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "explore_media" => Ok(Self::ExploreMedia),
      "studio" => Ok(Self::Studio),
      "upload_3d" => Ok(Self::Upload3d),
      "video_style_transfer" => Ok(Self::VideoStyleTransfer),
      "sd_wl" => Ok(Self::SeedanceWhitelist),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::ExploreMedia,
      Self::Studio,
      Self::Upload3d,
      Self::VideoStyleTransfer,
      Self::SeedanceWhitelist,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::users::user_feature_flag::UserFeatureFlag;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(UserFeatureFlag::ExploreMedia, "explore_media");
      assert_serialization(UserFeatureFlag::Studio, "studio");
      assert_serialization(UserFeatureFlag::Upload3d, "upload_3d");
      assert_serialization(UserFeatureFlag::VideoStyleTransfer, "video_style_transfer");
      assert_serialization(UserFeatureFlag::SeedanceWhitelist, "sd_wl");
    }

    #[test]
    fn test_to_str() {
      assert_eq!(UserFeatureFlag::ExploreMedia.to_str(), "explore_media");
      assert_eq!(UserFeatureFlag::Studio.to_str(), "studio");
      assert_eq!(UserFeatureFlag::Upload3d.to_str(), "upload_3d");
      assert_eq!(UserFeatureFlag::VideoStyleTransfer.to_str(), "video_style_transfer");
      assert_eq!(UserFeatureFlag::SeedanceWhitelist.to_str(), "sd_wl");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(UserFeatureFlag::from_str("explore_media").unwrap(), UserFeatureFlag::ExploreMedia);
      assert_eq!(UserFeatureFlag::from_str("studio").unwrap(), UserFeatureFlag::Studio);
      assert_eq!(UserFeatureFlag::from_str("upload_3d").unwrap(), UserFeatureFlag::Upload3d);
      assert_eq!(UserFeatureFlag::from_str("video_style_transfer").unwrap(), UserFeatureFlag::VideoStyleTransfer);
      assert_eq!(UserFeatureFlag::from_str("sd_wl").unwrap(), UserFeatureFlag::SeedanceWhitelist);
      assert!(UserFeatureFlag::from_str("foo").is_err());
    }

    #[test]
    fn all_variants() {
      let mut variants = UserFeatureFlag::all_variants();
      assert_eq!(variants.len(), 5);
      assert_eq!(variants.pop_first(), Some(UserFeatureFlag::ExploreMedia));
      assert_eq!(variants.pop_first(), Some(UserFeatureFlag::Studio));
      assert_eq!(variants.pop_first(), Some(UserFeatureFlag::Upload3d));
      assert_eq!(variants.pop_first(), Some(UserFeatureFlag::VideoStyleTransfer));
      assert_eq!(variants.pop_first(), Some(UserFeatureFlag::SeedanceWhitelist));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(UserFeatureFlag::all_variants().len(), UserFeatureFlag::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in UserFeatureFlag::all_variants() {
        assert_eq!(variant, UserFeatureFlag::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, UserFeatureFlag::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, UserFeatureFlag::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 32;
      for variant in UserFeatureFlag::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
