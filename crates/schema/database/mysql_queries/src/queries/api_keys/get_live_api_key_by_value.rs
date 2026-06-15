use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::users::UserToken;

use crate::queries::api_keys::api_key_row::ApiKeyRow;

pub struct GetLiveApiKeyByValueArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// The actual API key secret presented by the client.
  pub api_key: &'e str,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Look up a **live** API key by its secret value (for authenticating an
/// incoming request). Returns `Ok(None)` if no row matches OR if the matching
/// row is soft-deleted (`maybe_deleted_at IS NOT NULL`). The full secret is
/// never echoed back — only its first 20 characters — and the internal `id` is
/// omitted.
pub async fn get_live_api_key_by_value<'e, 'c: 'e, E>(
  args: GetLiveApiKeyByValueArgs<'e, 'c, E>,
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
WHERE api_key = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    args.api_key,
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
