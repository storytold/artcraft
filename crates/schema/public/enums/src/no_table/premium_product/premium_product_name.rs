use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// This enum is not backed by a particular database table.
/// This is used to count premium product uses for free and paid users.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, ToSchema)]
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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(PremiumProductName);
//impl_mysql_enum_coders!(PremiumProductName);
//impl_mysql_from_row!(PremiumProductName);

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
  use crate::no_table::premium_product::premium_product_name::PremiumProductName;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(PremiumProductName::FaceAnimator, "fa");
      assert_serialization(PremiumProductName::FaceMirror, "fm");
      assert_serialization(PremiumProductName::Lipsync, "lip");
      assert_serialization(PremiumProductName::VideoStyleTransfer, "vst");
    }

    mod impl_methods {
      use super::*;

      #[test]
      fn to_str() {
        assert_eq!(PremiumProductName::FaceAnimator.to_str(), "fa");
        assert_eq!(PremiumProductName::FaceMirror.to_str(), "fm");
        assert_eq!(PremiumProductName::Lipsync.to_str(), "lip");
        assert_eq!(PremiumProductName::VideoStyleTransfer.to_str(), "vst");
      }

      #[test]
      fn from_str() {
        assert_eq!(PremiumProductName::from_str("fa").unwrap(), PremiumProductName::FaceAnimator);
        assert_eq!(PremiumProductName::from_str("fm").unwrap(), PremiumProductName::FaceMirror);
        assert_eq!(PremiumProductName::from_str("lip").unwrap(), PremiumProductName::Lipsync);
        assert_eq!(PremiumProductName::from_str("vst").unwrap(), PremiumProductName::VideoStyleTransfer);
      }
    }

    mod manual_variant_checks {
      use super::*;

      #[test]
      fn all_variants() {
        let variants = PremiumProductName::all_variants();
        assert_eq!(variants.len(), 4);
      }
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
          assert_eq!(variant, PremiumProductName::from_str(&format!("{}", variant)).unwrap());
          assert_eq!(variant, PremiumProductName::from_str(&format!("{:?}", variant)).unwrap());
        }
      }
    }
  }
}
