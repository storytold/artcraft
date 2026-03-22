use strum::EnumCount;
use strum::EnumIter;

/// This enum is not backed by a particular database table.
/// This is used to count premium product uses for free and paid users.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, EnumIter, EnumCount)]
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
    use strum::IntoEnumIterator;

    #[test]
    fn round_trip() {
      for variant in PremiumProductName::iter() {
        assert_eq!(variant, PremiumProductName::from_str(variant.to_str()).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      for variant in PremiumProductName::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
