use std::collections::BTreeSet;

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

/// NB: Legacy API for older code.
impl FeaturedItemEntityType {
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::MediaFile => "media_file",
            Self::ModelWeight => "model_weight",
            Self::User => "user",
        }
    }

    pub fn from_str(value: &str) -> Result<Self, String> {
        match value {
            "media_file" => Ok(Self::MediaFile),
            "model_weight" => Ok(Self::ModelWeight),
            "user" => Ok(Self::User),
            _ => Err(format!("invalid value: {:?}", value)),
        }
    }

    pub fn all_variants() -> BTreeSet<Self> {
        // NB: BTreeSet is sorted
        // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
        BTreeSet::from([
            Self::MediaFile,
            Self::ModelWeight,
            Self::User,
        ])
    }
}

#[cfg(test)]
mod tests {
  use super::FeaturedItemEntityType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in FeaturedItemEntityType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: FeaturedItemEntityType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
