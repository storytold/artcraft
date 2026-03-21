use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// This enum is not backed by a particular database table.
/// This is used to count premium product uses for free and paid users.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum PremiumProductName {
  #[serde(rename = "fa")]
  FaceAnimator,
  #[serde(rename = "fm")]
  FaceMirror,
  #[serde(rename = "lip")]
  Lipsync,
  #[serde(rename = "vst")]
  VideoStyleTransfer,
}

impl_enum_display_and_debug_using_to_str!(PremiumProductName);

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
  use enums_shared::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(PremiumProductName::FaceAnimator, "fa");
    assert_serialization(PremiumProductName::FaceMirror, "fm");
    assert_serialization(PremiumProductName::Lipsync, "lip");
    assert_serialization(PremiumProductName::VideoStyleTransfer, "vst");
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(PremiumProductName::all_variants().len(), PremiumProductName::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in PremiumProductName::all_variants() {
        assert_eq!(variant, PremiumProductName::from_str(variant.to_str()).unwrap());
      }
    }
  }
}
