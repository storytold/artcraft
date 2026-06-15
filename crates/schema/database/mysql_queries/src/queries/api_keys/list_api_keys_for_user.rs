use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::users::UserToken;

use crate::queries::api_keys::api_key_row::ApiKeyRow;

pub struct ListApiKeysForUserArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub owner_user_token: &'e UserToken,

  /// Page size and page offset. Pagination is LIMIT/OFFSET rather than keyset
  /// so we don't have to expose the internal `id`.
  pub limit: u32,
  pub offset: u32,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// List a user's API keys, newest first, **including soft-deleted** keys.
/// Never returns the full `api_key` — only its first 20 characters — and never
/// returns the internal `id`.
pub async fn list_api_keys_for_user<'e, 'c: 'e, E>(
  args: ListApiKeysForUserArgs<'e, 'c, E>,
) -> Result<Vec<ApiKeyRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let limit = args.limit as i64;
  let offset = args.offset as i64;

  let rows = sqlx::query!(
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
WHERE owner_user_token = ?
ORDER BY id DESC
LIMIT ? OFFSET ?
    "#,
    args.owner_user_token.as_str(),
    limit,
    offset,
  )
    .fetch_all(args.mysql_executor)
    .await?
    .into_iter()
    .map(|r| ApiKeyRow {
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
    })
    .collect::<Vec<_>>();

  Ok(rows)
}
