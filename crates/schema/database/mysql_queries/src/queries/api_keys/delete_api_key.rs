use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::api_keys::ApiKeyToken;

pub struct DeleteApiKeyArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub token: &'e ApiKeyToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Soft-delete an API key by stamping `maybe_deleted_at = NOW()`. Returns the
/// number of rows affected (0 if no live key matched the token).
pub async fn delete_api_key<'e, 'c: 'e, E>(
  args: DeleteApiKeyArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE api_keys
SET maybe_deleted_at = NOW()
WHERE token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    args.token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(result.rows_affected())
}
