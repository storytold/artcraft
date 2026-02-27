use log::info;
use sqlx::MySql;

use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;
use tokens::tokens::wallets::WalletToken;

use crate::queries::wallet_ledger_entries::internal_insert_wallet_ledger_entry::InsertWalletLedgerEntry;
use crate::queries::wallets::internal_select_wallet_balance_for_update::internal_select_wallet_balance_for_update;
use crate::queries::wallets::refund::wallet_refund_error::WalletRefundError;

pub enum WalletRefundOutcome {
  /// The refund was successfully applied.
  Refunded(WalletRefundSummary),

  /// The ledger entry was already marked as refunded; no action was taken.
  /// This is not an error — it is safe to call refund multiple times.
  AlreadyRefunded,
}

pub struct WalletRefundSummary {
  pub wallet_token: WalletToken,
  pub original_ledger_entry_token: WalletLedgerEntryToken,
  pub refund_ledger_entry_token: WalletLedgerEntryToken,
  pub refund_amount: u64,
  pub banked_credits_before: u64,
  pub banked_credits_after: u64,
}

/// Refund a wallet ledger entry, crediting the amount back as banked (durable) credits.
///
/// NB: BE VERY CAREFUL WITH THIS FUNCTION!
/// It locks both the ledger entry row and the wallet row for the duration of the transaction.
///
/// We always refund into banked credits rather than monthly credits. Refunding into monthly
/// credits near a billing cycle cutoff could create race conditions with the monthly refill job,
/// so banked credits are the safer, permanent choice.
pub async fn try_to_refund_ledger_entry(
  ledger_entry_token: &WalletLedgerEntryToken,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<WalletRefundOutcome, WalletRefundError> {

  // Step 1: Lock the original ledger entry for the duration of this transaction.
  let original_entry = select_ledger_entry_for_update(ledger_entry_token, transaction).await?;

  // Step 2: Guard — bail out gracefully if it was already refunded.
  if original_entry.is_refunded {
    return Ok(WalletRefundOutcome::AlreadyRefunded);
  }

  // Step 3: Guard — only deduct-type entries may be refunded.
  let is_deduct_type = matches!(
    original_entry.entry_type,
    WalletLedgerEntryType::DeductMixed
      | WalletLedgerEntryType::DeductBanked
      | WalletLedgerEntryType::DeductMonthly,
  );

  if !is_deduct_type {
    return Err(WalletRefundError::NotADeductEntry(original_entry.entry_type));
  }

  // Step 4: Lock the wallet row so our balance arithmetic is atomic.
  let wallet = internal_select_wallet_balance_for_update(
    &original_entry.wallet_token,
    transaction,
  ).await.map_err(|_| WalletRefundError::WalletNotFound)?;

  // credits_delta was negative for a deduction (e.g. -100). The refund amount is its magnitude.
  let refund_amount = original_entry.credits_delta.unsigned_abs();

  let banked_credits_before = wallet.banked_credits;
  let banked_credits_after = banked_credits_before.saturating_add(refund_amount);

  // Step 5: Insert the refund ledger entry.
  //
  // We record the original ledger entry token as the entity_ref so there is a clear audit trail
  // linking the refund back to the original spend. The new entry itself has is_refunded = false
  // because it is the refund, not the thing being refunded.
  let refund_ledger_record = InsertWalletLedgerEntry {
    wallet_token: &original_entry.wallet_token,
    entry_type: WalletLedgerEntryType::RefundBanked,
    maybe_entity_ref: Some(ledger_entry_token.to_string()),

    credits_delta: refund_amount as i64,

    banked_credits_before,
    banked_credits_after,

    // Monthly credits are untouched by a banked refund.
    monthly_credits_before: wallet.monthly_credits,
    monthly_credits_after: wallet.monthly_credits,
  };

  let refund_ledger_entry_token = refund_ledger_record
    .upsert_with_transaction(transaction)
    .await?;

  // Step 6: Credit the wallet's banked balance.
  sqlx::query!(
    r#"
UPDATE wallets
SET
  banked_credits = ?,
  version = version + 1
WHERE token = ?
LIMIT 1
    "#,
    banked_credits_after,
    original_entry.wallet_token.as_str(),
  ).execute(&mut **transaction).await?;

  // Step 7: Mark the original entry as refunded and link it to the new refund record.
  sqlx::query!(
    r#"
UPDATE wallet_ledger_entries
SET
  is_refunded = TRUE,
  maybe_linked_refund_ledger_token = ?
WHERE token = ?
LIMIT 1
    "#,
    refund_ledger_entry_token.as_str(),
    ledger_entry_token.as_str(),
  ).execute(&mut **transaction).await?;

  info!(
    "Refunded ledger entry {} → new refund entry {}; wallet {} banked credits: {} → {}",
    ledger_entry_token.as_str(),
    refund_ledger_entry_token.as_str(),
    original_entry.wallet_token.as_str(),
    banked_credits_before,
    banked_credits_after,
  );

  Ok(WalletRefundOutcome::Refunded(WalletRefundSummary {
    wallet_token: original_entry.wallet_token,
    original_ledger_entry_token: ledger_entry_token.clone(),
    refund_ledger_entry_token,
    refund_amount,
    banked_credits_before,
    banked_credits_after,
  }))
}

// ===== Internal helpers =====

struct LedgerEntryForUpdate {
  wallet_token: WalletToken,
  entry_type: WalletLedgerEntryType,
  is_refunded: bool,
  /// Negative for deductions, positive for credits.
  credits_delta: i64,
  banked_credits_before: u64,
  banked_credits_after: u64,
  monthly_credits_before: u64,
  monthly_credits_after: u64,
}

/// SELECT ... FOR UPDATE on wallet_ledger_entries.
/// Locks the row for the duration of the enclosing transaction.
async fn select_ledger_entry_for_update(
  ledger_entry_token: &WalletLedgerEntryToken,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<LedgerEntryForUpdate, WalletRefundError> {

  struct RawLedgerEntryForUpdate {
    wallet_token: WalletToken,
    entry_type: String,
    is_refunded: bool,
    credits_delta: i32,
    banked_credits_before: u32,
    banked_credits_after: u32,
    monthly_credits_before: u32,
    monthly_credits_after: u32,
  }

  let raw = sqlx::query_as!(
    RawLedgerEntryForUpdate,
    r#"
SELECT
  wallet_token as `wallet_token: tokens::tokens::wallets::WalletToken`,
  entry_type,
  is_refunded as `is_refunded: bool`,
  credits_delta,
  banked_credits_before,
  banked_credits_after,
  monthly_credits_before,
  monthly_credits_after
FROM wallet_ledger_entries
WHERE token = ?
LIMIT 1
FOR UPDATE
    "#,
    ledger_entry_token.as_str(),
  )
    .fetch_one(&mut **transaction)
    .await
    .map_err(|e| match e {
      sqlx::Error::RowNotFound => WalletRefundError::LedgerEntryNotFound,
      err => WalletRefundError::SqlxError(err),
    })?;

  let entry_type = WalletLedgerEntryType::from_str(&raw.entry_type)
    .map_err(|_| WalletRefundError::SqlxError(sqlx::Error::Decode(
      format!("unknown wallet_ledger_entry entry_type: {:?}", raw.entry_type).into()
    )))?;

  Ok(LedgerEntryForUpdate {
    wallet_token: raw.wallet_token,
    entry_type,
    is_refunded: raw.is_refunded,
    credits_delta: raw.credits_delta as i64,
    banked_credits_before: raw.banked_credits_before as u64,
    banked_credits_after: raw.banked_credits_after as u64,
    monthly_credits_before: raw.monthly_credits_before as u64,
    monthly_credits_after: raw.monthly_credits_after as u64,
  })
}
