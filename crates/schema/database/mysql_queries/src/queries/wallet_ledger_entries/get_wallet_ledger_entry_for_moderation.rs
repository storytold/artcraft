use anyhow::anyhow;
use log::warn;
use sqlx::MySqlPool;

use chrono::{DateTime, Utc};
use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use errors::AnyhowResult;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

pub struct WalletLedgerEntryForModerationResult {
  pub token: WalletLedgerEntryToken,
  pub entry_type: WalletLedgerEntryType,
  pub maybe_entity_ref: Option<String>,
  pub credits_delta: i32,
  pub banked_credits_before: u32,
  pub banked_credits_after: u32,
  pub monthly_credits_before: u32,
  pub monthly_credits_after: u32,
  pub is_refunded: bool,
  pub maybe_linked_refund_ledger_token: Option<WalletLedgerEntryToken>,
  pub created_at: DateTime<Utc>,
}

pub async fn get_wallet_ledger_entry_for_moderation(
  wallet_ledger_entry_token: &WalletLedgerEntryToken,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Option<WalletLedgerEntryForModerationResult>> {
  let result = sqlx::query_as!(
    WalletLedgerEntryForModerationResult,
    r#"
SELECT
    token as `token: tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken`,
    entry_type as `entry_type: enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType`,
    maybe_entity_ref,
    credits_delta,
    banked_credits_before as `banked_credits_before: u32`,
    banked_credits_after as `banked_credits_after: u32`,
    monthly_credits_before as `monthly_credits_before: u32`,
    monthly_credits_after as `monthly_credits_after: u32`,
    is_refunded as `is_refunded: bool`,
    maybe_linked_refund_ledger_token as `maybe_linked_refund_ledger_token: tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken`,
    created_at as `created_at: DateTime<Utc>`
FROM wallet_ledger_entries
WHERE token = ?
LIMIT 1
    "#,
    wallet_ledger_entry_token,
  )
    .fetch_one(mysql_pool)
    .await;

  match result {
    Ok(record) => Ok(Some(record)),
    Err(sqlx::Error::RowNotFound) => Ok(None),
    Err(err) => {
      warn!("get_wallet_ledger_entry_for_moderation query error: {:?}", err);
      Err(anyhow!("query error"))
    }
  }
}
