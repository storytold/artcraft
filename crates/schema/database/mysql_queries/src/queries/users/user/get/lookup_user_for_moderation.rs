use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::MySqlPool;

use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

pub struct LookupUserForModerationResult {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub username_is_generated: bool,
  pub is_temporary: bool,
  pub username_is_not_customized: bool,
  pub email_address: String,
  pub email_confirmed: bool,
  pub email_is_synthetic: bool,
  pub is_without_password: bool,
  pub ip_address_creation: String,
  pub ip_address_last_login: String,
  pub maybe_avatar_media_file_token: Option<String>,
  pub email_gravatar_hash: String,
  pub created_at: DateTime<Utc>,
}

pub async fn lookup_user_for_moderation_by_token(
  token: &str,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Option<LookupUserForModerationResult>> {
  let result = sqlx::query_as!(
    LookupUserForModerationResult,
    r#"
SELECT
    users.token as `user_token: tokens::tokens::users::UserToken`,
    username,
    display_name,
    username_is_generated as `username_is_generated: bool`,
    is_temporary as `is_temporary: bool`,
    username_is_not_customized as `username_is_not_customized: bool`,
    email_address,
    email_confirmed as `email_confirmed: bool`,
    email_is_synthetic as `email_is_synthetic: bool`,
    is_without_password as `is_without_password: bool`,
    ip_address_creation,
    ip_address_last_login,
    maybe_avatar_media_file_token,
    email_gravatar_hash,
    created_at
FROM users
WHERE
    users.token = ?
    AND users.user_deleted_at IS NULL
    AND users.mod_deleted_at IS NULL
LIMIT 1
    "#,
    token,
  )
    .fetch_one(mysql_pool)
    .await;

  match result {
    Ok(record) => Ok(Some(record)),
    Err(sqlx::Error::RowNotFound) => Ok(None),
    Err(err) => {
      warn!("lookup_user_for_moderation_by_token query error: {:?}", err);
      Err(anyhow!("query error"))
    }
  }
}

pub async fn lookup_user_for_moderation_by_email(
  email: &str,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Option<LookupUserForModerationResult>> {
  let email = email.trim().to_lowercase();

  let result = sqlx::query_as!(
    LookupUserForModerationResult,
    r#"
SELECT
    users.token as `user_token: tokens::tokens::users::UserToken`,
    username,
    display_name,
    username_is_generated as `username_is_generated: bool`,
    is_temporary as `is_temporary: bool`,
    username_is_not_customized as `username_is_not_customized: bool`,
    email_address,
    email_confirmed as `email_confirmed: bool`,
    email_is_synthetic as `email_is_synthetic: bool`,
    is_without_password as `is_without_password: bool`,
    ip_address_creation,
    ip_address_last_login,
    maybe_avatar_media_file_token,
    email_gravatar_hash,
    created_at
FROM users
WHERE
    users.email_address = ?
    AND users.user_deleted_at IS NULL
    AND users.mod_deleted_at IS NULL
LIMIT 1
    "#,
    email,
  )
    .fetch_one(mysql_pool)
    .await;

  match result {
    Ok(record) => Ok(Some(record)),
    Err(sqlx::Error::RowNotFound) => Ok(None),
    Err(err) => {
      warn!("lookup_user_for_moderation_by_email query error: {:?}", err);
      Err(anyhow!("query error"))
    }
  }
}

pub async fn lookup_user_for_moderation_by_username(
  username: &str,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Option<LookupUserForModerationResult>> {
  let username = username.trim().to_lowercase();

  let result = sqlx::query_as!(
    LookupUserForModerationResult,
    r#"
SELECT
    users.token as `user_token: tokens::tokens::users::UserToken`,
    username,
    display_name,
    username_is_generated as `username_is_generated: bool`,
    is_temporary as `is_temporary: bool`,
    username_is_not_customized as `username_is_not_customized: bool`,
    email_address,
    email_confirmed as `email_confirmed: bool`,
    email_is_synthetic as `email_is_synthetic: bool`,
    is_without_password as `is_without_password: bool`,
    ip_address_creation,
    ip_address_last_login,
    maybe_avatar_media_file_token,
    email_gravatar_hash,
    created_at
FROM users
WHERE
    users.username = ?
    AND users.user_deleted_at IS NULL
    AND users.mod_deleted_at IS NULL
LIMIT 1
    "#,
    username,
  )
    .fetch_one(mysql_pool)
    .await;

  match result {
    Ok(record) => Ok(Some(record)),
    Err(sqlx::Error::RowNotFound) => Ok(None),
    Err(err) => {
      warn!("lookup_user_for_moderation_by_username query error: {:?}", err);
      Err(anyhow!("query error"))
    }
  }
}
