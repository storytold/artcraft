use std::collections::BTreeSet;

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

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::ExploreMedia,
      Self::Studio,
      Self::Upload3d,
      Self::VideoStyleTransfer,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::UserFeatureFlag;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in UserFeatureFlag::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: UserFeatureFlag = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
