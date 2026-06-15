use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::api_keys::ApiKeyToken;

pub struct UpdateApiKeyArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub token: &'e ApiKeyToken,
  pub maybe_description: Option<&'e str>,

  /// IP address of the request making the update; stamped on `ip_address_update`.
  pub ip_address: &'e str,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Update an API key's `maybe_description`, also refreshing `ip_address_update`
/// (and, via the column's `ON UPDATE` clause, `updated_at`). Scoped to live keys
/// only. Returns the number of rows affected (0 if no live key matched).
pub async fn update_api_key<'e, 'c: 'e, E>(
  args: UpdateApiKeyArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE api_keys
SET
  maybe_description = ?,
  ip_address_update = ?
WHERE token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    args.maybe_description,
    args.ip_address,
    args.token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(result.rows_affected())
}
