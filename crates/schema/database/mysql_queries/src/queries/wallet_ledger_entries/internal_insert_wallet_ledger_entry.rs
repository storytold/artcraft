use anyhow::anyhow;
use log::error;
use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use errors::AnyhowResult;
use sqlx::mysql::MySqlArguments;
use sqlx::pool::PoolConnection;
use sqlx::query::Query;
use sqlx::{MySql, MySqlPool, Transaction};
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;
use tokens::tokens::wallets::WalletToken;

// TODO: Make a trait (eg. `InsertableRecord`, `UpsertableRecord`) with default impls to handle common query concerns.

pub (crate) struct InsertWalletLedgerEntry<'a> {
  /// The wallet
  pub wallet_token: &'a WalletToken,

  /// The type of entry
  pub entry_type: WalletLedgerEntryType,

  /// An optional reference for this entry. Could be an internal ID (eg. job) or an
  /// external ID (eg. Stripe payment intent, invoice, etc.)
  pub maybe_entity_ref: Option<String>,

  /// Change in credits (positive or negative) across banked and/or monthly credits.
  pub credits_delta: i64,

  /// Banked credits before change.
  pub banked_credits_before: u64,

  /// Banked credits after change.
  pub banked_credits_after: u64,

  /// Banked credits before change.
  pub monthly_credits_before: u64,

  /// Banked credits after change.
  pub monthly_credits_after: u64,
}

impl <'a> InsertWalletLedgerEntry<'a> {

  pub async fn upsert_with_pool(&'a self, mysql_pool: &MySqlPool) -> AnyhowResult<WalletLedgerEntryToken> {
    let mut conn = mysql_pool.acquire().await?;
    self.upsert_with_connection(&mut conn).await
  }

  pub async fn upsert_with_connection(&'a self, mysql_connection: &mut PoolConnection<MySql>) -> AnyhowResult<WalletLedgerEntryToken> {
    let ledger_token = WalletLedgerEntryToken::generate();
    let query_result = self.query_with_token(&ledger_token).execute(&mut **mysql_connection).await;

    match query_result {
      Ok(_) => Ok(ledger_token),
      Err(err) => Err(anyhow!("Error upserting wallet ledger entry record: {:?}", err)),
    }
  }

  pub async fn upsert_with_transaction(&'a self, transaction: &mut Transaction<'_, MySql>) -> Result<WalletLedgerEntryToken, sqlx::Error> {
    let ledger_token = WalletLedgerEntryToken::generate();
    let query_result = self.query_with_token(&ledger_token).execute(&mut **transaction).await;

    match query_result {
      Ok(_) => Ok(ledger_token),
      Err(err) => {
        error!("Error upserting wallet ledger entry record: {:?}", err);
        Err(err)
      },
    }
  }

  fn query_with_token(&self, ledger_token: &WalletLedgerEntryToken) -> Query<MySql, MySqlArguments> {
    sqlx::query!(
        r#"
INSERT INTO wallet_ledger_entries
SET
  token = ?,
  wallet_token = ?,
  entry_type = ?,
  maybe_entity_ref = ?,
  credits_delta = ?,
  banked_credits_before = ?,
  banked_credits_after = ?,
  monthly_credits_before = ?,
  monthly_credits_after = ?
        "#,
      ledger_token.as_str(),
      self.wallet_token.as_str(),
      self.entry_type.to_str(),
      self.maybe_entity_ref,
      self.credits_delta,
      self.banked_credits_before,
      self.banked_credits_after,
      self.monthly_credits_before,
      self.monthly_credits_after,
    )
  }
}
