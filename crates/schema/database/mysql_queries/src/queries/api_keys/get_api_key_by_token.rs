use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::users::UserToken;

use crate::queries::api_keys::api_key_row::ApiKeyRow;

pub struct GetApiKeyByTokenArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub token: &'e ApiKeyToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Look up an API key by its `token`. Returns every detail (including
/// `maybe_deleted_at`, so soft-deleted keys are still visible here) except the
/// internal `id` and the full secret `api_key` (only its first 20 characters
/// are returned). `Ok(None)` if no row matches the token.
pub async fn get_api_key_by_token<'e, 'c: 'e, E>(
  args: GetApiKeyByTokenArgs<'e, 'c, E>,
) -> Result<Option<ApiKeyRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
SELECT
  token as `token: ApiKeyToken`,
  LEFT(api_key, 20) as `api_key_prefix!`,
  name,
  maybe_description,
  owner_user_token as `owner_user_token: UserToken`,
  ip_address_creation,
  ip_address_update,
  created_at,
  updated_at,
  maybe_deleted_at
FROM api_keys
WHERE token = ?
LIMIT 1
    "#,
    args.token.as_str(),
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(result.map(|r| ApiKeyRow {
    token: r.token,
    api_key_prefix: r.api_key_prefix,
    name: r.name,
    maybe_description: r.maybe_description,
    owner_user_token: r.owner_user_token,
    ip_address_creation: r.ip_address_creation,
    ip_address_update: r.ip_address_update,
    created_at: r.created_at,
    updated_at: r.updated_at,
    maybe_deleted_at: r.maybe_deleted_at,
  }))
}
