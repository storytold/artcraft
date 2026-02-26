use crate::queries::wallet_ledger_entries::internal_insert_wallet_ledger_entry::InsertWalletLedgerEntry;
use crate::queries::wallets::internal_select_wallet_balance_for_update::internal_select_wallet_balance_for_update;
use crate::queries::wallets::wallet_update_summary::WalletUpdateSummary;
use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use num_traits::ToPrimitive;
use sqlx::MySql;
use tokens::tokens::wallets::WalletToken;

pub async fn refill_monthly_credits_balance_on_wallet(
  wallet_token: &WalletToken,
  monthly_amount: u64,
  maybe_ledger_ref: Option<&str>,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> anyhow::Result<WalletUpdateSummary> {

  // NB: Transaction lock (!) Be careful (!!)
  let wallet = internal_select_wallet_balance_for_update(
    wallet_token,
    transaction
  ).await?;

  let existing_monthly_balance = wallet.monthly_credits;
  let new_monthly_balance = monthly_amount;

  let result = sqlx::query!(
        r#"
    UPDATE wallets
    SET
        monthly_credits = ?,
        version = version + 1
    WHERE token = ?
    LIMIT 1
        "#,
    new_monthly_balance,
    wallet_token.as_str(),
  ).execute(&mut **transaction)
      .await?;

  let record = InsertWalletLedgerEntry {
    wallet_token,
    entry_type: WalletLedgerEntryType::CreditMonthly,
    maybe_entity_ref: maybe_ledger_ref.map(|s| s.to_string()),

    credits_delta: monthly_amount.to_i64().unwrap_or(0),
    
    monthly_credits_before: existing_monthly_balance,
    monthly_credits_after: new_monthly_balance,

    // Unchanged
    banked_credits_before: wallet.banked_credits,
    banked_credits_after: wallet.banked_credits,
  };

  let wallet_ledger_entry_token = record.upsert_with_transaction(transaction).await?;


  Ok(WalletUpdateSummary {
    wallet_token: wallet.token,
    wallet_ledger_entry_token,
    namespace: wallet.namespace,
    owner_user_token: wallet.owner_user_token,

    // We updated monthly credits
    monthly_credits_before: existing_monthly_balance,
    monthly_credits_now: new_monthly_balance,

    // Banked credits not touched
    banked_credits_before: wallet.banked_credits,
    banked_credits_now: wallet.banked_credits,
  })
}
