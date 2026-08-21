use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `user_spend_events` table in a `VARCHAR(16)` field.
///
/// Where a spend event came from. USD/Stripe only for the foreseeable future;
/// `manual` covers staff/console adjustments (which carry a NULL source_object_id).
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum PaymentSource {
  /// Stripe (the source for essentially all rows).
  #[serde(rename = "stripe")]
  Stripe,

  /// Manual staff / console adjustment (no provider object).
  #[serde(rename = "manual")]
  Manual,
}

impl_enum_display_and_debug_using_to_str!(PaymentSource);
impl_mysql_enum_coders!(PaymentSource);
impl_mysql_from_row!(PaymentSource);

/// NB: Legacy API for older code.
impl PaymentSource {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Stripe => "stripe",
      Self::Manual => "manual",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "stripe" => Ok(Self::Stripe),
      "manual" => Ok(Self::Manual),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Stripe,
      Self::Manual,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::user_spend_events::payment_source::PaymentSource;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(PaymentSource::Stripe, "stripe");
      assert_serialization(PaymentSource::Manual, "manual");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(PaymentSource::Stripe.to_str(), "stripe");
      assert_eq!(PaymentSource::Manual.to_str(), "manual");
    }

    #[test]
    fn from_str() {
      assert_eq!(PaymentSource::from_str("stripe").unwrap(), PaymentSource::Stripe);
      assert_eq!(PaymentSource::from_str("manual").unwrap(), PaymentSource::Manual);
      assert!(PaymentSource::from_str("foo").is_err());
    }
  }

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = PaymentSource::all_variants();
      assert_eq!(variants.len(), 2);
      assert_eq!(variants.pop_first(), Some(PaymentSource::Stripe));
      assert_eq!(variants.pop_first(), Some(PaymentSource::Manual));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(PaymentSource::all_variants().len(), PaymentSource::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in PaymentSource::all_variants() {
        assert_eq!(variant, PaymentSource::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, PaymentSource::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, PaymentSource::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 16;
      for variant in PaymentSource::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
