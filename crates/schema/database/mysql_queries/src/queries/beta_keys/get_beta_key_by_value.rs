use anyhow::anyhow;
use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums_db::by_table::beta_keys::beta_key_product::BetaKeyProduct;
use errors::AnyhowResult;
use tokens::tokens::beta_keys::BetaKeyToken;
use tokens::tokens::users::UserToken;

pub struct BetaKey {
  pub token: BetaKeyToken,

  pub product: BetaKeyProduct,
  pub key_value: String,

  pub maybe_referrer_user_token: Option<UserToken>,
  pub maybe_referrer_username: Option<String>,
  pub maybe_referrer_display_name: Option<String>,
  pub maybe_referrer_gravatar_hash: Option<String>,

  pub maybe_redeemer_user_token: Option<UserToken>,
  pub maybe_redeemer_username: Option<String>,
  pub maybe_redeemer_display_name: Option<String>,
  pub maybe_redeemer_gravatar_hash: Option<String>,

  pub created_at: DateTime<Utc>,
  pub maybe_redeemed_at: Option<DateTime<Utc>>,
}

pub async fn get_beta_key_by_value<'e, 'c, E>(
  key_value: &'e str,
  mysql_executor: E
)
  -> AnyhowResult<Option<BetaKey>>
  where E: 'e + Executor<'c, Database = MySql>
{

  let maybe_results = sqlx::query_as!(
      RawRecord,
        r#"
SELECT
  b.token as `token: tokens::tokens::beta_keys::BetaKeyToken`,

  b.product as `product: enums_db::by_table::beta_keys::beta_key_product::BetaKeyProduct`,
  b.key_value,

  b.maybe_referrer_user_token as `maybe_referrer_user_token: tokens::tokens::users::UserToken`,
  referrer.username as maybe_referrer_username,
  referrer.display_name as maybe_referrer_display_name,
  referrer.email_gravatar_hash as maybe_referrer_gravatar_hash,

  b.maybe_redeemer_user_token as `maybe_redeemer_user_token: tokens::tokens::users::UserToken`,
  redeemer.username as maybe_redeemer_username,
  redeemer.display_name as maybe_redeemer_display_name,
  redeemer.email_gravatar_hash as maybe_redeemer_gravatar_hash,

  b.created_at,
  b.maybe_redeemed_at

FROM beta_keys AS b

LEFT OUTER JOIN users AS referrer
    ON b.maybe_referrer_user_token = referrer.token

LEFT OUTER JOIN users AS redeemer
    ON b.maybe_redeemer_user_token = redeemer.token

WHERE
    b.key_value = ?
        "#,
      key_value
    )
      .fetch_one(mysql_executor)
      .await;

  match maybe_results {
    Ok(record) => Ok(Some(BetaKey {
      token: record.token,
      product: record.product,
      key_value: record.key_value,
      maybe_referrer_user_token: record.maybe_referrer_user_token,
      maybe_referrer_username: record.maybe_referrer_username,
      maybe_referrer_display_name: record.maybe_referrer_display_name,
      maybe_referrer_gravatar_hash: record.maybe_referrer_gravatar_hash,
      maybe_redeemer_user_token: record.maybe_redeemer_user_token,
      maybe_redeemer_username: record.maybe_redeemer_username,
      maybe_redeemer_display_name: record.maybe_redeemer_display_name,
      maybe_redeemer_gravatar_hash: record.maybe_redeemer_gravatar_hash,
      created_at: record.created_at,
      maybe_redeemed_at: record.maybe_redeemed_at,
    })),
    Err(err) => match err {
      sqlx::Error::RowNotFound => Ok(None),
      _ => Err(anyhow!("Error querying: {:?}", err)),
    }
  }
}

pub struct RawRecord {
  token: BetaKeyToken,

  product: BetaKeyProduct,
  key_value: String,

  maybe_referrer_user_token: Option<UserToken>,
  maybe_referrer_username: Option<String>,
  maybe_referrer_display_name: Option<String>,
  maybe_referrer_gravatar_hash: Option<String>,

  maybe_redeemer_user_token: Option<UserToken>,
  maybe_redeemer_username: Option<String>,
  maybe_redeemer_display_name: Option<String>,
  maybe_redeemer_gravatar_hash: Option<String>,

  created_at: DateTime<Utc>,
  maybe_redeemed_at: Option<DateTime<Utc>>,
}
