use strum::EnumCount;
use strum::EnumIter;

/// Used in the `batch_generations` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, Ord, PartialOrd, EnumIter, EnumCount)]
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

}

#[cfg(test)]
mod tests {
  use super::super::beta_key_product::BetaKeyProduct;
  use enums_shared::test_helpers::assert_serialization;

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

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in BetaKeyProduct::iter() {
        assert_eq!(variant, BetaKeyProduct::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, BetaKeyProduct::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, BetaKeyProduct::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  
    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in BetaKeyProduct::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
