use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `wallet_ledger_entries` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum WalletLedgerEntryType {
  /// Wallet created
  #[serde(rename = "create")]
  Create,

  /// Credit durable banked balance
  #[serde(rename = "credit_banked")]
  CreditBanked,

  /// Credit monthly refill
  #[serde(rename = "credit_monthly")]
  CreditMonthly,

  /// Deduct credits (mixed durable and monthly deduction)
  #[serde(rename = "deduct_mixed")]
  DeductMixed,
  
  /// Deduct durable banked credits
  #[serde(rename = "deduct_banked")]
  DeductBanked,

  /// Deduct monthly credits
  #[serde(rename = "deduct_monthly")]
  DeductMonthly,

  /// Refund banked credits
  #[serde(rename = "refund_banked")]
  RefundBanked,

  // TODO: No clean way to do "mixed" refunds yet, and if we
  //  refund close to the cutoff it might be unfair. Let's
  //  just not do monthly refunds yet and instead credit our
  //  users with banked credits.
  // /// Refund monthly credits
  // #[serde(rename = "refund_monthly")]
  // RefundMonthly,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(WalletLedgerEntryType);
impl_mysql_enum_coders!(WalletLedgerEntryType);
impl_mysql_from_row!(WalletLedgerEntryType);

/// NB: Legacy API for older code.
impl WalletLedgerEntryType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Create => "create",
      Self::CreditBanked => "credit_banked",
      Self::CreditMonthly => "credit_monthly",
      Self::DeductMixed => "deduct_mixed",
      Self::DeductBanked => "deduct_banked",
      Self::DeductMonthly => "deduct_monthly",
      Self::RefundBanked => "refund_banked",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "create" => Ok(Self::Create),
      "credit_banked" => Ok(Self::CreditBanked),
      "credit_monthly" => Ok(Self::CreditMonthly),
      "deduct_mixed" => Ok(Self::DeductMixed),
      "deduct_banked" => Ok(Self::DeductBanked),
      "deduct_monthly" => Ok(Self::DeductMonthly),
      "refund_banked" => Ok(Self::RefundBanked),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Create,
      Self::CreditBanked,
      Self::CreditMonthly,
      Self::DeductMixed,
      Self::DeductBanked,
      Self::DeductMonthly,
      Self::RefundBanked,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(WalletLedgerEntryType::Create, "create");
      assert_serialization(WalletLedgerEntryType::CreditBanked, "credit_banked");
      assert_serialization(WalletLedgerEntryType::CreditMonthly, "credit_monthly");
      assert_serialization(WalletLedgerEntryType::DeductMixed, "deduct_mixed");
      assert_serialization(WalletLedgerEntryType::DeductBanked, "deduct_banked");
      assert_serialization(WalletLedgerEntryType::DeductMonthly, "deduct_monthly");
      assert_serialization(WalletLedgerEntryType::RefundBanked, "refund_banked");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(WalletLedgerEntryType::Create.to_str(), "create");
      assert_eq!(WalletLedgerEntryType::CreditBanked.to_str(), "credit_banked");
      assert_eq!(WalletLedgerEntryType::CreditMonthly.to_str(), "credit_monthly");
      assert_eq!(WalletLedgerEntryType::DeductMixed.to_str(), "deduct_mixed");
      assert_eq!(WalletLedgerEntryType::DeductBanked.to_str(), "deduct_banked");
      assert_eq!(WalletLedgerEntryType::DeductMonthly.to_str(), "deduct_monthly");
      assert_eq!(WalletLedgerEntryType::RefundBanked.to_str(), "refund_banked");
    }

    #[test]
    fn from_str() {
      assert_eq!(WalletLedgerEntryType::from_str("create").unwrap(), WalletLedgerEntryType::Create);
      assert_eq!(WalletLedgerEntryType::from_str("credit_banked").unwrap(), WalletLedgerEntryType::CreditBanked);
      assert_eq!(WalletLedgerEntryType::from_str("credit_monthly").unwrap(), WalletLedgerEntryType::CreditMonthly);
      assert_eq!(WalletLedgerEntryType::from_str("deduct_mixed").unwrap(), WalletLedgerEntryType::DeductMixed);
      assert_eq!(WalletLedgerEntryType::from_str("deduct_banked").unwrap(), WalletLedgerEntryType::DeductBanked);
      assert_eq!(WalletLedgerEntryType::from_str("deduct_monthly").unwrap(), WalletLedgerEntryType::DeductMonthly);
      assert_eq!(WalletLedgerEntryType::from_str("refund_banked").unwrap(), WalletLedgerEntryType::RefundBanked);
      assert!(WalletLedgerEntryType::from_str("foo").is_err());
    }
  }

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = WalletLedgerEntryType::all_variants();
      assert_eq!(variants.len(), 7);
      assert_eq!(variants.pop_first(), Some(WalletLedgerEntryType::Create));
      assert_eq!(variants.pop_first(), Some(WalletLedgerEntryType::CreditBanked));
      assert_eq!(variants.pop_first(), Some(WalletLedgerEntryType::CreditMonthly));
      assert_eq!(variants.pop_first(), Some(WalletLedgerEntryType::DeductMixed));
      assert_eq!(variants.pop_first(), Some(WalletLedgerEntryType::DeductBanked));
      assert_eq!(variants.pop_first(), Some(WalletLedgerEntryType::DeductMonthly));
      assert_eq!(variants.pop_first(), Some(WalletLedgerEntryType::RefundBanked));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(WalletLedgerEntryType::all_variants().len(), WalletLedgerEntryType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in WalletLedgerEntryType::all_variants() {
        assert_eq!(variant, WalletLedgerEntryType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, WalletLedgerEntryType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, WalletLedgerEntryType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 16;
      for variant in WalletLedgerEntryType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
