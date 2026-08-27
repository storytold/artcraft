use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::mcp_sessions::McpSessionToken;

pub struct DeleteMcpSessionArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub token: &'e McpSessionToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Terminate a session by its management `token` (the dashboard path), stamping
/// `maybe_deleted_at = NOW()`. Returns the number of rows affected (0 if no live session
/// matched the token). Ownership is NOT checked here — callers verify it first via
/// `get_mcp_session_by_token`.
pub async fn delete_mcp_session<'e, 'c: 'e, E>(
  args: DeleteMcpSessionArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE mcp_sessions
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
