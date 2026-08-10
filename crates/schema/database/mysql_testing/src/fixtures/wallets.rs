//! Wallet fixtures: create/fund wallets and read back balances + ledger
//! entries for assertions.

use anyhow::anyhow;
use enums::common::payments_namespace::PaymentsNamespace;
use sqlx::{MySqlPool, Row};
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

use mysql_queries::queries::wallets::add_durable_banked_balance_to_wallet::add_durable_banked_balance_to_wallet;
use mysql_queries::queries::wallets::create_new_artcraft_wallet_for_owner_user::create_new_artcraft_wallet_for_owner_user;
use mysql_queries::queries::wallets::find_primary_wallet_token_for_owner::find_primary_wallet_token_for_owner_using_transaction;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WalletBalance {
  pub banked_credits: u64,
  pub monthly_credits: u64,
}

impl WalletBalance {
  pub fn total(&self) -> u64 {
    self.banked_credits + self.monthly_credits
  }
}

#[derive(Clone, Debug)]
pub struct LedgerEntry {
  pub entry_type: String,
  pub credits_delta: i64,
  pub is_refunded: bool,
  pub maybe_entity_ref: Option<String>,
}

/// Ensure the user has an Artcraft wallet and add `credits` to its banked
/// balance. Returns the wallet token.
pub async fn fund_wallet_banked(
  pool: &MySqlPool,
  user_token: &UserToken,
  credits: u64,
) -> anyhow::Result<WalletToken> {
  let mut connection = pool.acquire().await?;
  let mut transaction = sqlx::Acquire::begin(&mut connection).await?;

  let maybe_wallet_token = find_primary_wallet_token_for_owner_using_transaction(
    user_token,
    PaymentsNamespace::Artcraft,
    &mut transaction,
  )
  .await
  .map_err(|err| anyhow!("find wallet failed: {err:?}"))?;

  let wallet_token = match maybe_wallet_token {
    Some(token) => token,
    None => create_new_artcraft_wallet_for_owner_user(user_token, &mut transaction).await?,
  };

  if credits > 0 {
    add_durable_banked_balance_to_wallet(
      &wallet_token,
      credits,
      Some("mysql_testing fixture"),
      None,
      &mut transaction,
    )
    .await?;
  }

  transaction.commit().await?;
  Ok(wallet_token)
}

/// The user's Artcraft wallet balance, or None if no wallet exists yet.
pub async fn artcraft_wallet_balance(
  pool: &MySqlPool,
  user_token: &UserToken,
) -> anyhow::Result<Option<WalletBalance>> {
  let maybe_row = sqlx::query(
    "SELECT banked_credits, monthly_credits FROM wallets \
     WHERE owner_user_token = ? AND wallet_namespace = ? \
     ORDER BY id ASC LIMIT 1",
  )
  .bind(user_token.as_str())
  .bind(PaymentsNamespace::Artcraft.to_str())
  .fetch_optional(pool)
  .await?;

  Ok(maybe_row.map(|row| WalletBalance {
    banked_credits: u64::from(row.get::<u32, _>("banked_credits")),
    monthly_credits: u64::from(row.get::<u32, _>("monthly_credits")),
  }))
}

/// All ledger entries for the wallet, oldest first.
pub async fn wallet_ledger_entries(
  pool: &MySqlPool,
  wallet_token: &WalletToken,
) -> anyhow::Result<Vec<LedgerEntry>> {
  let rows = sqlx::query(
    "SELECT entry_type, credits_delta, is_refunded, maybe_entity_ref \
     FROM wallet_ledger_entries WHERE wallet_token = ? ORDER BY id ASC",
  )
  .bind(wallet_token.as_str())
  .fetch_all(pool)
  .await?;

  Ok(rows
    .into_iter()
    .map(|row| LedgerEntry {
      entry_type: row.get::<String, _>("entry_type"),
      credits_delta: i64::from(row.get::<i32, _>("credits_delta")),
      is_refunded: row.get::<bool, _>("is_refunded"),
      maybe_entity_ref: row.get::<Option<String>, _>("maybe_entity_ref"),
    })
    .collect())
}
