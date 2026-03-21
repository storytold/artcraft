use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// This enum is not backed by a particular database table.
/// This is used to count premium product uses for free and paid users.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Debug, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, EnumIter, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum PremiumProductName {
  // NB: These keys are kept short to preserve space
  #[serde(rename = "fa")]
  FaceAnimator,
  // NB: These keys are kept short to preserve space
  #[serde(rename = "fm")]
  FaceMirror,
  // NB: These keys are kept short to preserve space
  #[serde(rename = "lip")]
  Lipsync,
  // NB: These keys are kept short to preserve space
  #[serde(rename = "vst")]
  VideoStyleTransfer,
}


/// NB: Legacy API for older code.
impl PremiumProductName {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::FaceAnimator => "fa",
      Self::FaceMirror => "fm",
      Self::Lipsync => "lip",
      Self::VideoStyleTransfer => "vst",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "fa" => Ok(Self::FaceAnimator),
      "fm" => Ok(Self::FaceMirror),
      "lip" => Ok(Self::Lipsync),
      "vst" => Ok(Self::VideoStyleTransfer),
      _ => Err(format!("Unknown PremiumProductName: {}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::FaceAnimator,
      Self::FaceMirror,
      Self::Lipsync,
      Self::VideoStyleTransfer,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::PremiumProductName;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in PremiumProductName::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: PremiumProductName = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
