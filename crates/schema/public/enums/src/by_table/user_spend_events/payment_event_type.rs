use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `user_spend_events` table in a `VARCHAR(32)` field.
///
/// Splits subscription revenue from credit-pack revenue, plus the
/// money-out (refund/chargeback) and non-revenue (manual / monthly refill) cases.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum PaymentEventType {
  /// First paid invoice of a new subscription.
  #[serde(rename = "subscription_initial")]
  SubscriptionInitial,

  /// Recurring paid invoice (monthly, or annual once per year).
  #[serde(rename = "subscription_renewal")]
  SubscriptionRenewal,

  /// Proration charge from a mid-cycle upgrade (positive amount).
  #[serde(rename = "subscription_proration_upgrade")]
  SubscriptionProrationUpgrade,

  /// Proration credit from a mid-cycle downgrade (typically a balance credit;
  /// rare as a standalone settled event). NB: "subscription_proration_downgrade"
  /// is 32 chars -- exactly the event_type VARCHAR(32) limit (zero headroom).
  #[serde(rename = "subscription_proration_downgrade")]
  SubscriptionProrationDowngrade,

  /// One-time credit pack purchase (the ~10x-volume case).
  #[serde(rename = "credit_pack_purchase")]
  CreditPackPurchase,

  /// Refund (amount negative).
  #[serde(rename = "refund")]
  Refund,

  /// Dispute / chargeback (amount negative).
  #[serde(rename = "chargeback")]
  Chargeback,

  /// Staff / console correction (payment_source = 'manual').
  #[serde(rename = "manual_adjustment")]
  ManualAdjustment,

  /// Non-revenue event for annual-plan monthly credit refills (amount 0).
  #[serde(rename = "subscription_monthly_refill")]
  SubscriptionMonthlyRefill,
}

impl_enum_display_and_debug_using_to_str!(PaymentEventType);
impl_mysql_enum_coders!(PaymentEventType);
impl_mysql_from_row!(PaymentEventType);

/// NB: Legacy API for older code.
impl PaymentEventType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::SubscriptionInitial => "subscription_initial",
      Self::SubscriptionRenewal => "subscription_renewal",
      Self::SubscriptionProrationUpgrade => "subscription_proration_upgrade",
      Self::SubscriptionProrationDowngrade => "subscription_proration_downgrade",
      Self::CreditPackPurchase => "credit_pack_purchase",
      Self::Refund => "refund",
      Self::Chargeback => "chargeback",
      Self::ManualAdjustment => "manual_adjustment",
      Self::SubscriptionMonthlyRefill => "subscription_monthly_refill",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "subscription_initial" => Ok(Self::SubscriptionInitial),
      "subscription_renewal" => Ok(Self::SubscriptionRenewal),
      "subscription_proration_upgrade" => Ok(Self::SubscriptionProrationUpgrade),
      "subscription_proration_downgrade" => Ok(Self::SubscriptionProrationDowngrade),
      "credit_pack_purchase" => Ok(Self::CreditPackPurchase),
      "refund" => Ok(Self::Refund),
      "chargeback" => Ok(Self::Chargeback),
      "manual_adjustment" => Ok(Self::ManualAdjustment),
      "subscription_monthly_refill" => Ok(Self::SubscriptionMonthlyRefill),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::SubscriptionInitial,
      Self::SubscriptionRenewal,
      Self::SubscriptionProrationUpgrade,
      Self::SubscriptionProrationDowngrade,
      Self::CreditPackPurchase,
      Self::Refund,
      Self::Chargeback,
      Self::ManualAdjustment,
      Self::SubscriptionMonthlyRefill,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::user_spend_events::payment_event_type::PaymentEventType;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(PaymentEventType::SubscriptionInitial, "subscription_initial");
      assert_serialization(PaymentEventType::SubscriptionRenewal, "subscription_renewal");
      assert_serialization(PaymentEventType::SubscriptionProrationUpgrade, "subscription_proration_upgrade");
      assert_serialization(PaymentEventType::SubscriptionProrationDowngrade, "subscription_proration_downgrade");
      assert_serialization(PaymentEventType::CreditPackPurchase, "credit_pack_purchase");
      assert_serialization(PaymentEventType::Refund, "refund");
      assert_serialization(PaymentEventType::Chargeback, "chargeback");
      assert_serialization(PaymentEventType::ManualAdjustment, "manual_adjustment");
      assert_serialization(PaymentEventType::SubscriptionMonthlyRefill, "subscription_monthly_refill");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(PaymentEventType::SubscriptionInitial.to_str(), "subscription_initial");
      assert_eq!(PaymentEventType::SubscriptionRenewal.to_str(), "subscription_renewal");
      assert_eq!(PaymentEventType::SubscriptionProrationUpgrade.to_str(), "subscription_proration_upgrade");
      assert_eq!(PaymentEventType::SubscriptionProrationDowngrade.to_str(), "subscription_proration_downgrade");
      assert_eq!(PaymentEventType::CreditPackPurchase.to_str(), "credit_pack_purchase");
      assert_eq!(PaymentEventType::Refund.to_str(), "refund");
      assert_eq!(PaymentEventType::Chargeback.to_str(), "chargeback");
      assert_eq!(PaymentEventType::ManualAdjustment.to_str(), "manual_adjustment");
      assert_eq!(PaymentEventType::SubscriptionMonthlyRefill.to_str(), "subscription_monthly_refill");
    }

    #[test]
    fn from_str() {
      assert_eq!(PaymentEventType::from_str("subscription_initial").unwrap(), PaymentEventType::SubscriptionInitial);
      assert_eq!(PaymentEventType::from_str("subscription_renewal").unwrap(), PaymentEventType::SubscriptionRenewal);
      assert_eq!(PaymentEventType::from_str("subscription_proration_upgrade").unwrap(), PaymentEventType::SubscriptionProrationUpgrade);
      assert_eq!(PaymentEventType::from_str("subscription_proration_downgrade").unwrap(), PaymentEventType::SubscriptionProrationDowngrade);
      assert_eq!(PaymentEventType::from_str("credit_pack_purchase").unwrap(), PaymentEventType::CreditPackPurchase);
      assert_eq!(PaymentEventType::from_str("refund").unwrap(), PaymentEventType::Refund);
      assert_eq!(PaymentEventType::from_str("chargeback").unwrap(), PaymentEventType::Chargeback);
      assert_eq!(PaymentEventType::from_str("manual_adjustment").unwrap(), PaymentEventType::ManualAdjustment);
      assert_eq!(PaymentEventType::from_str("subscription_monthly_refill").unwrap(), PaymentEventType::SubscriptionMonthlyRefill);
      assert!(PaymentEventType::from_str("foo").is_err());
    }
  }

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = PaymentEventType::all_variants();
      assert_eq!(variants.len(), 9);
      assert_eq!(variants.pop_first(), Some(PaymentEventType::SubscriptionInitial));
      assert_eq!(variants.pop_first(), Some(PaymentEventType::SubscriptionRenewal));
      assert_eq!(variants.pop_first(), Some(PaymentEventType::SubscriptionProrationUpgrade));
      assert_eq!(variants.pop_first(), Some(PaymentEventType::SubscriptionProrationDowngrade));
      assert_eq!(variants.pop_first(), Some(PaymentEventType::CreditPackPurchase));
      assert_eq!(variants.pop_first(), Some(PaymentEventType::Refund));
      assert_eq!(variants.pop_first(), Some(PaymentEventType::Chargeback));
      assert_eq!(variants.pop_first(), Some(PaymentEventType::ManualAdjustment));
      assert_eq!(variants.pop_first(), Some(PaymentEventType::SubscriptionMonthlyRefill));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(PaymentEventType::all_variants().len(), PaymentEventType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in PaymentEventType::all_variants() {
        assert_eq!(variant, PaymentEventType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, PaymentEventType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, PaymentEventType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32;
      for variant in PaymentEventType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
