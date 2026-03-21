use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `batch_generations` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, Ord, PartialOrd, ToSchema, EnumIter, Debug)]
pub enum BatchGenerationEntityType {
  /// Media files
  /// This will probably be the only type supported, but we'll leave the possibility of future types.
  #[serde(rename = "media_file")]
  MediaFile,
}

/// NB: Legacy API for older code.
impl BatchGenerationEntityType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::MediaFile => "media_file",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "media_file" => Ok(Self::MediaFile),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::MediaFile,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::BatchGenerationEntityType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in BatchGenerationEntityType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: BatchGenerationEntityType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
