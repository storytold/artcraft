use std::collections::BTreeSet;

use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `batch_generations` table in a `VARCHAR(32)` field named `entity_type`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, Ord, PartialOrd, ToSchema)]
pub enum BetaKeyProduct {
  /// Media files
  /// This will probably be the only type supported, but we'll leave the possibility of future types.
  #[serde(rename = "studio")]
  Studio,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(BetaKeyProduct);
impl_mysql_enum_coders!(BetaKeyProduct);
impl_mysql_from_row!(BetaKeyProduct);

/// NB: Legacy API for older code.
impl BetaKeyProduct {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Studio => "studio",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "studio" => Ok(Self::Studio),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Studio,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::beta_keys::beta_key_product::BetaKeyProduct;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(BetaKeyProduct::Studio, "studio");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(BetaKeyProduct::Studio.to_str(), "studio");
    }

    #[test]
    fn from_str() {
      assert_eq!(BetaKeyProduct::from_str("studio").unwrap(), BetaKeyProduct::Studio);
      assert!(BetaKeyProduct::from_str("foo").is_err());
    }
  }

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = BetaKeyProduct::all_variants();
      assert_eq!(variants.len(), 1);
      assert_eq!(variants.pop_first(), Some(BetaKeyProduct::Studio));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(BetaKeyProduct::all_variants().len(), BetaKeyProduct::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in BetaKeyProduct::all_variants() {
        assert_eq!(variant, BetaKeyProduct::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, BetaKeyProduct::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, BetaKeyProduct::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
