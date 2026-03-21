use std::collections::BTreeSet;

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

/// NB: Legacy API for older code.
impl StatsEntityType {
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::Comment => "comment",
            Self::MediaFile => "media_file",
            Self::ModelWeight => "model_weight",
        }
    }

    pub fn from_str(value: &str) -> Result<Self, String> {
        match value {
            "comment" => Ok(Self::Comment),
            "media_file" => Ok(Self::MediaFile),
            "model_weight" => Ok(Self::ModelWeight),
            _ => Err(format!("invalid value: {:?}", value)),
        }
    }

    pub fn all_variants() -> BTreeSet<Self> {
        // NB: BTreeSet is sorted
        // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
        BTreeSet::from([
            Self::Comment,
            Self::MediaFile,
            Self::ModelWeight,
        ])
    }
}

#[cfg(test)]
mod tests {
  use super::StatsEntityType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in StatsEntityType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: StatsEntityType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
