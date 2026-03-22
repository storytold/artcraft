use crate::queries::wallet_ledger_entries::internal_insert_wallet_ledger_entry::InsertWalletLedgerEntry;
use enums_db::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use sqlx::MySql;
use tokens::tokens::wallets::WalletToken;

pub (crate) async fn internal_insert_wallet_created_ledger_entry(
  wallet_token: &WalletToken,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<(), sqlx::Error> {

  let record = InsertWalletLedgerEntry {
    wallet_token,
    entry_type: WalletLedgerEntryType::Create,
    maybe_entity_ref: None,
    credits_delta: 0,
    banked_credits_before: 0,
    banked_credits_after: 0,
    monthly_credits_before: 0,
    monthly_credits_after: 0,
  };

  record.upsert_with_transaction(transaction).await?;

  Ok(())
}
