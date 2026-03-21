use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// This enum is not backed by a particular database table.
/// This is used to determine the video generation size.
#[derive(Clone, Debug, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, EnumIter, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum VideoDimensions {
  Landscape,
  Portrait,
  Square,
}


/// NB: Legacy API for older code.
impl VideoDimensions {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Landscape => "landscape",
      Self::Portrait => "portrait",
      Self::Square => "square",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "landscape" => Ok(Self::Landscape),
      "portrait" => Ok(Self::Portrait),
      "square" => Ok(Self::Square),
      _ => Err(format!("Unknown VideoDimensions: {}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Landscape,
      Self::Portrait,
      Self::Square,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::VideoDimensions;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in VideoDimensions::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: VideoDimensions = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
