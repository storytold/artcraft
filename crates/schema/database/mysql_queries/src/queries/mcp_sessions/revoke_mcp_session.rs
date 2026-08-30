use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::mcp_session_private::McpSessionPrivateToken;

pub struct RevokeMcpSessionArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub private_session_token: &'e McpSessionPrivateToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Terminate a session by its own private credential, stamping `maybe_deleted_at = NOW()`.
/// An expired-but-undeleted session may still revoke itself (the end state is the same either
/// way). Returns the number of rows affected (0 = unknown or already-terminated session).
pub async fn revoke_mcp_session<'e, 'c: 'e, E>(
  args: RevokeMcpSessionArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE mcp_sessions
SET maybe_deleted_at = NOW()
WHERE private_session_token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    args.private_session_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(result.rows_affected())
}
