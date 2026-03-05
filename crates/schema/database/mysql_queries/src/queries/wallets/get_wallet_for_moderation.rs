use anyhow::anyhow;
use log::warn;
use sqlx::MySqlPool;

use chrono::{DateTime, Utc};
use enums::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

pub struct WalletForModerationResult {
  pub token: WalletToken,
  pub wallet_namespace: PaymentsNamespace,
  pub owner_user_token: UserToken,
  pub banked_credits: u32,
  pub monthly_credits: u32,
  pub version: i32,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub async fn get_wallet_for_moderation(
  wallet_token: &WalletToken,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Option<WalletForModerationResult>> {
  let result = sqlx::query_as!(
    WalletForModerationResult,
    r#"
SELECT
    w.token as `token: tokens::tokens::wallets::WalletToken`,
    w.wallet_namespace as `wallet_namespace: enums::common::payments_namespace::PaymentsNamespace`,
    w.owner_user_token as `owner_user_token: tokens::tokens::users::UserToken`,
    w.banked_credits as `banked_credits: u32`,
    w.monthly_credits as `monthly_credits: u32`,
    w.version,
    w.created_at as `created_at: DateTime<Utc>`,
    w.updated_at as `updated_at: DateTime<Utc>`
FROM wallets as w
WHERE w.token = ?
LIMIT 1
    "#,
    wallet_token,
  )
    .fetch_one(mysql_pool)
    .await;

  match result {
    Ok(record) => Ok(Some(record)),
    Err(sqlx::Error::RowNotFound) => Ok(None),
    Err(err) => {
      warn!("get_wallet_for_moderation query error: {:?}", err);
      Err(anyhow!("query error"))
    }
  }
}
