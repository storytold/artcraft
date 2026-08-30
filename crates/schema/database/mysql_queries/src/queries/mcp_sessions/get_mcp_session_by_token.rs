use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::mcp_sessions::McpSessionToken;
use tokens::tokens::users::UserToken;

use crate::queries::mcp_sessions::mcp_session_row::McpSessionRow;

pub struct GetMcpSessionByTokenArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub token: &'e McpSessionToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Fetch a session by its management `token` (NOT the private credential), including terminated
/// sessions — callers check ownership and `maybe_deleted_at` themselves. Never returns the
/// `private_session_token`.
pub async fn get_mcp_session_by_token<'e, 'c: 'e, E>(
  args: GetMcpSessionByTokenArgs<'e, 'c, E>,
) -> Result<Option<McpSessionRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let maybe_row = sqlx::query!(
    r#"
SELECT
  token as `token: McpSessionToken`,
  user_token as `user_token: UserToken`,
  maybe_mcp_client_name,
  maybe_mcp_client_version,
  maybe_mcp_client_vendor,
  ip_address_creation,
  ip_address_update,
  created_at,
  updated_at,
  expires_at,
  maybe_deleted_at
FROM mcp_sessions
WHERE token = ?
LIMIT 1
    "#,
    args.token.as_str(),
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(maybe_row.map(|r| McpSessionRow {
    token: r.token,
    user_token: r.user_token,
    maybe_mcp_client_name: r.maybe_mcp_client_name,
    maybe_mcp_client_version: r.maybe_mcp_client_version,
    maybe_mcp_client_vendor: r.maybe_mcp_client_vendor,
    ip_address_creation: r.ip_address_creation,
    ip_address_update: r.ip_address_update,
    created_at: r.created_at,
    updated_at: r.updated_at,
    expires_at: r.expires_at,
    maybe_deleted_at: r.maybe_deleted_at,
  }))
}
