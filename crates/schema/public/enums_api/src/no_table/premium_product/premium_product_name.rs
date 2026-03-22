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

#[cfg(test)]
mod tests {
  use super::PremiumProductName;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(PremiumProductName::FaceAnimator, "fa");
      assert_serialization(PremiumProductName::FaceMirror, "fm");
      assert_serialization(PremiumProductName::Lipsync, "lip");
      assert_serialization(PremiumProductName::VideoStyleTransfer, "vst");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("fa", PremiumProductName::FaceAnimator);
      assert_deserialization("fm", PremiumProductName::FaceMirror);
      assert_deserialization("lip", PremiumProductName::Lipsync);
      assert_deserialization("vst", PremiumProductName::VideoStyleTransfer);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(PremiumProductName::iter().count(), 4);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in PremiumProductName::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: PremiumProductName = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
