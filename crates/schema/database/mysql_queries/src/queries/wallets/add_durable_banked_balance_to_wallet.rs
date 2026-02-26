use crate::queries::wallet_ledger_entries::internal_insert_wallet_ledger_entry::InsertWalletLedgerEntry;
use crate::queries::wallets::internal_select_wallet_balance_for_update::internal_select_wallet_balance_for_update;
use crate::queries::wallets::wallet_update_summary::WalletUpdateSummary;
use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use num_traits::ToPrimitive;
use sqlx::MySql;
use tokens::tokens::wallets::WalletToken;

pub async fn add_durable_banked_balance_to_wallet(
  wallet_token: &WalletToken,
  amount_to_add: u64,
  maybe_ledger_ref: Option<&str>,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> anyhow::Result<WalletUpdateSummary> {

  // NB: Transaction lock (!) Be careful (!!)
  let wallet = internal_select_wallet_balance_for_update(
    wallet_token,
    transaction
  ).await?;

  let existing_banked_balance = wallet.banked_credits;
  let new_banked_balance = existing_banked_balance.saturating_add(amount_to_add);

  let result = sqlx::query!(
        r#"
    UPDATE wallets
    SET
        banked_credits = ?,
        version = version + 1
    WHERE token = ?
    LIMIT 1
        "#,
    new_banked_balance,
    wallet_token.as_str(),
  ).execute(&mut **transaction)
      .await?;

  let record = InsertWalletLedgerEntry {
    wallet_token,
    entry_type: WalletLedgerEntryType::CreditBanked,
    maybe_entity_ref: maybe_ledger_ref.map(|t| t.to_string()),

    credits_delta: amount_to_add.to_i64().unwrap_or(0),
    
    // Updated banked credits
    banked_credits_before: existing_banked_balance,
    banked_credits_after: new_banked_balance,

    // Unchanged monthly credits
    monthly_credits_before: wallet.monthly_credits,
    monthly_credits_after: wallet.monthly_credits,
  };

  let wallet_ledger_entry_token = record.upsert_with_transaction(transaction).await?;


  Ok(WalletUpdateSummary {
    wallet_token: wallet.token,
    wallet_ledger_entry_token,
    namespace: wallet.namespace,
    owner_user_token: wallet.owner_user_token,

    // Updated banked credits
    banked_credits_before: existing_banked_balance,
    banked_credits_now: new_banked_balance,

    // Unchanged monthly credits
    monthly_credits_now: wallet.monthly_credits,
    monthly_credits_before: wallet.monthly_credits,
  })
}