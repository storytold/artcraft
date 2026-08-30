use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::mcp_session_private::McpSessionPrivateToken;
use tokens::tokens::mcp_session_refresh::McpSessionRefreshToken;

use crate::queries::mcp_sessions::insert_mcp_session::MCP_SESSION_LIFETIME_DAYS;

pub struct RefreshMcpSessionArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub private_session_token: &'e McpSessionPrivateToken,

  /// The session's CURRENT refresh credential. A stale or wrong value refreshes nothing.
  pub private_refresh_token: &'e McpSessionRefreshToken,

  /// Stamped on `ip_address_update`.
  pub ip_address: &'e str,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Push a live session's expiry [`MCP_SESSION_LIFETIME_DAYS`] days out from MySQL `NOW()` and
/// ROTATE its refresh credential (`updated_at` bumps automatically). Both the session
/// credential and the current refresh token must match a live, unexpired session — otherwise
/// nothing refreshes and `Ok(None)` is returned.
///
/// The rotation is deliberately NOT idempotent: each success mints (here, in the data-access
/// layer) and returns a new refresh token, and the previous one is gone. Callers retrying a
/// refresh whose response they lost will get an error, not a replay — we don't store the
/// history of refresh tokens.
pub async fn refresh_mcp_session<'e, 'c: 'e, E>(
  args: RefreshMcpSessionArgs<'e, 'c, E>,
) -> Result<Option<McpSessionRefreshToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let new_refresh_token = McpSessionRefreshToken::generate();

  let result = sqlx::query!(
    r#"
UPDATE mcp_sessions
SET
  expires_at = NOW() + INTERVAL ? DAY,
  private_refresh_token = ?,
  ip_address_update = ?
WHERE private_session_token = ?
  AND private_refresh_token = ?
  AND maybe_deleted_at IS NULL
  AND expires_at > NOW()
LIMIT 1
    "#,
    MCP_SESSION_LIFETIME_DAYS,
    new_refresh_token.as_str(),
    args.ip_address,
    args.private_session_token.as_str(),
    args.private_refresh_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  if result.rows_affected() == 0 {
    return Ok(None);
  }

  Ok(Some(new_refresh_token))
}
