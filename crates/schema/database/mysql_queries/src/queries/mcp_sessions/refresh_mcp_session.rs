use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::mcp_session_private::McpSessionPrivateToken;

use crate::queries::mcp_sessions::insert_mcp_session::MCP_SESSION_LIFETIME_DAYS;

pub struct RefreshMcpSessionArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub private_session_token: &'e McpSessionPrivateToken,

  /// Stamped on `ip_address_update`.
  pub ip_address: &'e str,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Push a live session's expiry [`MCP_SESSION_LIFETIME_DAYS`] days out from now (`updated_at`
/// bumps automatically). Only live sessions refresh: a terminated or already-expired session
/// matches no row. Returns the number of rows affected (0 = the session is not refreshable).
pub async fn refresh_mcp_session<'e, 'c: 'e, E>(
  args: RefreshMcpSessionArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE mcp_sessions
SET
  expires_at = NOW() + INTERVAL ? DAY,
  ip_address_update = ?
WHERE private_session_token = ?
  AND maybe_deleted_at IS NULL
  AND expires_at > NOW()
LIMIT 1
    "#,
    MCP_SESSION_LIFETIME_DAYS,
    args.ip_address,
    args.private_session_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(result.rows_affected())
}
