use anyhow::anyhow;
use log::warn;
use sqlx::MySqlPool;

use chrono::{DateTime, Utc};
use enums::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

pub struct UserWalletForModerationResult {
  pub token: WalletToken,
  pub wallet_namespace: PaymentsNamespace,
  pub banked_credits: u32,
  pub monthly_credits: u32,
  pub version: i32,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub async fn list_user_wallets_for_moderation(
  user_token: &UserToken,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Vec<UserWalletForModerationResult>> {
  let results = sqlx::query_as!(
    UserWalletForModerationResult,
    r#"
SELECT
    w.token as `token: tokens::tokens::wallets::WalletToken`,
    w.wallet_namespace as `wallet_namespace: enums::common::payments_namespace::PaymentsNamespace`,
    w.banked_credits as `banked_credits: u32`,
    w.monthly_credits as `monthly_credits: u32`,
    w.version,
    w.created_at as `created_at: DateTime<Utc>`,
    w.updated_at as `updated_at: DateTime<Utc>`
FROM wallets as w
WHERE w.owner_user_token = ?
ORDER BY w.id DESC
    "#,
    user_token,
  )
    .fetch_all(mysql_pool)
    .await;

  match results {
    Ok(records) => Ok(records),
    Err(err) => {
      warn!("list_user_wallets_for_moderation query error: {:?}", err);
      Err(anyhow!("query error"))
    }
  }
}
