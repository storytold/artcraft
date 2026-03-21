use std::collections::BTreeSet;
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `tag_uses` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
pub enum TagUseEntityType {
  /// Media files
  #[serde(rename = "media_file")]
  MediaFile,

  /// Model weights
  #[serde(rename = "model_weight")]
  ModelWeight,
}

/// NB: Legacy API for older code.
impl TagUseEntityType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::MediaFile => "media_file",
      Self::ModelWeight => "model_weight",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "media_file" => Ok(Self::MediaFile),
      "model_weight" => Ok(Self::ModelWeight),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
  
  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::MediaFile,
      Self::ModelWeight,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::TagUseEntityType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in TagUseEntityType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: TagUseEntityType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
