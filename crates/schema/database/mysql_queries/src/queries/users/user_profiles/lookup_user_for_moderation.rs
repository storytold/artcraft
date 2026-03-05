use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::MySqlPool;

use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::i8_to_bool;

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

struct RawLookupUserRecord {
  user_token: UserToken,
  username: String,
  display_name: String,
  username_is_generated: i8,
  is_temporary: i8,
  username_is_not_customized: i8,
  email_address: String,
  email_confirmed: i8,
  email_is_synthetic: i8,
  is_without_password: i8,
  ip_address_creation: String,
  ip_address_last_login: String,
  maybe_avatar_media_file_token: Option<String>,
  email_gravatar_hash: String,
  created_at: DateTime<Utc>,
}

impl From<RawLookupUserRecord> for LookupUserForModerationResult {
  fn from(raw: RawLookupUserRecord) -> Self {
    Self {
      user_token: raw.user_token,
      username: raw.username,
      display_name: raw.display_name,
      username_is_generated: i8_to_bool(raw.username_is_generated),
      is_temporary: i8_to_bool(raw.is_temporary),
      username_is_not_customized: i8_to_bool(raw.username_is_not_customized),
      email_address: raw.email_address,
      email_confirmed: i8_to_bool(raw.email_confirmed),
      email_is_synthetic: i8_to_bool(raw.email_is_synthetic),
      is_without_password: i8_to_bool(raw.is_without_password),
      ip_address_creation: raw.ip_address_creation,
      ip_address_last_login: raw.ip_address_last_login,
      maybe_avatar_media_file_token: raw.maybe_avatar_media_file_token,
      email_gravatar_hash: raw.email_gravatar_hash,
      created_at: raw.created_at,
    }
  }
}

const QUERY: &str = r#"
SELECT
    users.token as `user_token: tokens::tokens::users::UserToken`,
    username,
    display_name,
    username_is_generated,
    is_temporary,
    username_is_not_customized,
    email_address,
    email_confirmed,
    email_is_synthetic,
    is_without_password,
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
"#;

pub async fn lookup_user_for_moderation_by_token(
  token: &str,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Option<LookupUserForModerationResult>> {
  let result = sqlx::query_as!(
    RawLookupUserRecord,
    r#"
SELECT
    users.token as `user_token: tokens::tokens::users::UserToken`,
    username,
    display_name,
    username_is_generated,
    is_temporary,
    username_is_not_customized,
    email_address,
    email_confirmed,
    email_is_synthetic,
    is_without_password,
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
    Ok(record) => Ok(Some(record.into())),
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
    RawLookupUserRecord,
    r#"
SELECT
    users.token as `user_token: tokens::tokens::users::UserToken`,
    username,
    display_name,
    username_is_generated,
    is_temporary,
    username_is_not_customized,
    email_address,
    email_confirmed,
    email_is_synthetic,
    is_without_password,
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
    Ok(record) => Ok(Some(record.into())),
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
    RawLookupUserRecord,
    r#"
SELECT
    users.token as `user_token: tokens::tokens::users::UserToken`,
    username,
    display_name,
    username_is_generated,
    is_temporary,
    username_is_not_customized,
    email_address,
    email_confirmed,
    email_is_synthetic,
    is_without_password,
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
    Ok(record) => Ok(Some(record.into())),
    Err(sqlx::Error::RowNotFound) => Ok(None),
    Err(err) => {
      warn!("lookup_user_for_moderation_by_username query error: {:?}", err);
      Err(anyhow!("query error"))
    }
  }
}
