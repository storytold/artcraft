use std::collections::BTreeSet;

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
      Self::StaffAddBanked => "staff_add_banked",
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
      "staff_add_banked" => Ok(Self::StaffAddBanked),
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
      Self::StaffAddBanked,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::WalletLedgerEntryType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in WalletLedgerEntryType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: WalletLedgerEntryType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
