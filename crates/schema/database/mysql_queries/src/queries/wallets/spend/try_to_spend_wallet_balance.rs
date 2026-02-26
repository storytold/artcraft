use crate::queries::wallet_ledger_entries::internal_insert_wallet_ledger_entry::InsertWalletLedgerEntry;
use crate::queries::wallets::internal_select_wallet_balance_for_update::internal_select_wallet_balance_for_update;
use crate::queries::wallets::spend::wallet_spend_error::WalletSpendError;
use crate::queries::wallets::wallet_update_summary::WalletUpdateSummary;
use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use num_traits::ToPrimitive;
use sqlx::MySql;
use std::ops::Neg;
use tokens::tokens::wallets::WalletToken;

// TODO(bt, 2025-09-12): This needs tests and a better interface.

/// Attempt to spend credits from a wallet. 
/// Deducts from monthly credits first, then banked credits if needed.
/// Attempts everything within a single transactional critical section - but make sure not to keep 
/// the transaction open for too long beyond this! We're locking the wallet record!
pub async fn try_to_spend_wallet_balance(
  wallet_token: &WalletToken,
  amount_to_spend_request: u64,
  maybe_ledger_ref: Option<&str>,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<WalletUpdateSummary, WalletSpendError> {
  
  if amount_to_spend_request == 0 {
    return Err(WalletSpendError::InvalidAmountToSpend);
  }

  // NB: Transaction lock (!) Be careful (!!)
  let wallet = internal_select_wallet_balance_for_update(
    wallet_token,
    transaction
  ).await?;

  let total_available = wallet.banked_credits.saturating_add(wallet.monthly_credits);
  
  if total_available < amount_to_spend_request {
    return Err(WalletSpendError::InsufficientBalance {
      requested_to_spend_amount: amount_to_spend_request,
      available_amount: total_available,
    });
  }
  
  // TODO(bt, 2025-09-12): This needs tests
  
  let existing_banked_balance = wallet.banked_credits;
  let existing_monthly_balance = wallet.monthly_credits;
  
  let mut updated_banked_balance = existing_banked_balance;
  let mut updated_monthly_balance = existing_monthly_balance;
  
  let ledger_entry_type;
  
  if existing_monthly_balance >= amount_to_spend_request {
    updated_monthly_balance = existing_monthly_balance.saturating_sub(amount_to_spend_request);
    ledger_entry_type = WalletLedgerEntryType::DeductMonthly;
    
  } else if existing_monthly_balance > 0 {
    let paid = existing_monthly_balance;
    let remaining_invoice = amount_to_spend_request.saturating_sub(paid);
    
    if remaining_invoice > existing_banked_balance {
      // NB: We shouldn't hit this, but just to be safe...
      return Err(WalletSpendError::InsufficientBalance {
        requested_to_spend_amount: amount_to_spend_request,
        available_amount: total_available,
      });
    }
    
    updated_banked_balance = existing_banked_balance.saturating_sub(remaining_invoice);
    updated_monthly_balance = 0;
    ledger_entry_type = WalletLedgerEntryType::DeductMixed;
    
  } else if existing_banked_balance >= amount_to_spend_request {
    updated_banked_balance = existing_banked_balance.saturating_sub(amount_to_spend_request);
    ledger_entry_type = WalletLedgerEntryType::DeductBanked;
    
  } else {
    // NB: We shouldn't hit this, but just to be safe...
    return Err(WalletSpendError::InsufficientBalance {
      requested_to_spend_amount: amount_to_spend_request,
      available_amount: total_available,
    });
  }
  
  let result = sqlx::query!(
        r#"
    UPDATE wallets
    SET
        banked_credits = ?,
        monthly_credits = ?,
        version = version + 1
    WHERE token = ?
    LIMIT 1
        "#,
    updated_banked_balance,
    updated_monthly_balance,
    wallet_token.as_str(),
  ).execute(&mut **transaction).await?;
  
  let spent = amount_to_spend_request.to_i64().unwrap_or(0).neg();

  let record = InsertWalletLedgerEntry {
    wallet_token,
    entry_type: ledger_entry_type,
    maybe_entity_ref: maybe_ledger_ref.map(|t| t.to_string()),

    credits_delta: spent,

    // Original amounts
    monthly_credits_before: existing_monthly_balance,
    banked_credits_before: existing_banked_balance,

    // Updated amounts
    monthly_credits_after: updated_monthly_balance,
    banked_credits_after: updated_banked_balance
  };

  let wallet_ledger_entry_token = record.upsert_with_transaction(transaction).await?;

  Ok(WalletUpdateSummary {
    wallet_token: wallet.token,
    wallet_ledger_entry_token,
    namespace: wallet.namespace,
    owner_user_token: wallet.owner_user_token,

    // Original amounts
    monthly_credits_before: existing_monthly_balance,
    banked_credits_before: existing_banked_balance,

    // Updated amounts
    monthly_credits_now: updated_monthly_balance,
    banked_credits_now: updated_banked_balance
  })
}
