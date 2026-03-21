use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `usages` table in a `VARCHAR(16)` field. (Two fields!)
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]
pub enum UsagesType {
  /// Represents a foreign key link against a model_weights record
  ModelWeight,

  /// Represents a foreign key link against a media_files record
  MediaFile,
}

/// NB: Legacy API for older code.
impl UsagesType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::ModelWeight => "model_weight",
      Self::MediaFile => "media_file",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "model_weight" => Ok(Self::ModelWeight),
      "media_file" => Ok(Self::MediaFile),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::ModelWeight,
      Self::MediaFile,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::UsagesType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in UsagesType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: UsagesType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
