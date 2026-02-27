use crate::errors::select_exactly_one_error::SelectExactlyOneError;
use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum WalletRefundError {
  /// The wallet ledger entry to refund was not found.
  LedgerEntryNotFound,

  /// The wallet referenced by the ledger entry was not found.
  WalletNotFound,

  /// The ledger entry is not a deduct-type entry; only DeductMixed, DeductBanked,
  /// and DeductMonthly entries can be refunded.
  NotADeductEntry(WalletLedgerEntryType),

  /// Error selecting a record.
  SelectError(SelectExactlyOneError),

  /// Underlying database error.
  SqlxError(sqlx::Error),
}

impl Error for WalletRefundError {}

impl Display for WalletRefundError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      WalletRefundError::LedgerEntryNotFound => write!(f, "Ledger entry not found"),
      WalletRefundError::WalletNotFound => write!(f, "Wallet not found"),
      WalletRefundError::NotADeductEntry(entry_type) => {
        write!(f, "Cannot refund a non-deduct ledger entry: {:?}", entry_type)
      }
      WalletRefundError::SelectError(err) => write!(f, "Database select error: {}", err),
      WalletRefundError::SqlxError(err) => write!(f, "Database error: {}", err),
    }
  }
}

impl From<SelectExactlyOneError> for WalletRefundError {
  fn from(err: SelectExactlyOneError) -> Self {
    WalletRefundError::SelectError(err)
  }
}

impl From<sqlx::Error> for WalletRefundError {
  fn from(err: sqlx::Error) -> Self {
    WalletRefundError::SqlxError(err)
  }
}
