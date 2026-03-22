use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `wallet_ledger_entries` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
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

  /// Support staff manually credit account
  #[serde(rename = "staff_add_banked")]
  StaffAddBanked,

  // TODO: No clean way to do "mixed" refunds yet, and if we
  //  refund close to the cutoff it might be unfair. Let's
  //  just not do monthly refunds yet and instead credit our
  //  users with banked credits.
  // /// Refund monthly credits
  // #[serde(rename = "refund_monthly")]
  // RefundMonthly,
}

#[cfg(test)]
mod tests {
  use super::WalletLedgerEntryType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
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
      assert_serialization(WalletLedgerEntryType::StaffAddBanked, "staff_add_banked");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("create", WalletLedgerEntryType::Create);
      assert_deserialization("credit_banked", WalletLedgerEntryType::CreditBanked);
      assert_deserialization("credit_monthly", WalletLedgerEntryType::CreditMonthly);
      assert_deserialization("deduct_mixed", WalletLedgerEntryType::DeductMixed);
      assert_deserialization("deduct_banked", WalletLedgerEntryType::DeductBanked);
      assert_deserialization("deduct_monthly", WalletLedgerEntryType::DeductMonthly);
      assert_deserialization("refund_banked", WalletLedgerEntryType::RefundBanked);
      assert_deserialization("staff_add_banked", WalletLedgerEntryType::StaffAddBanked);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(WalletLedgerEntryType::iter().count(), 8);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in WalletLedgerEntryType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: WalletLedgerEntryType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
