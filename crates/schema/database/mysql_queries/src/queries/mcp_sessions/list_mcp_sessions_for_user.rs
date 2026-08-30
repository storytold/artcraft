use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::mcp_sessions::McpSessionToken;
use tokens::tokens::users::UserToken;

use crate::queries::mcp_sessions::mcp_session_row::McpSessionRow;

pub struct ListMcpSessionsForUserArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub user_token: &'e UserToken,

  /// Page size and page offset. Pagination is LIMIT/OFFSET rather than keyset
  /// so we don't have to expose the internal `id`.
  pub limit: u32,
  pub offset: u32,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// List a user's MCP sessions, newest first, **including terminated** sessions (each row carries
/// `maybe_deleted_at` and `expires_at` so callers can filter). Never returns the secret
/// `private_session_token`.
pub async fn list_mcp_sessions_for_user<'e, 'c: 'e, E>(
  args: ListMcpSessionsForUserArgs<'e, 'c, E>,
) -> Result<Vec<McpSessionRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let limit = args.limit as i64;
  let offset = args.offset as i64;

  let rows = sqlx::query!(
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
WHERE user_token = ?
ORDER BY id DESC
LIMIT ? OFFSET ?
    "#,
    args.user_token.as_str(),
    limit,
    offset,
  )
    .fetch_all(args.mysql_executor)
    .await?
    .into_iter()
    .map(|r| McpSessionRow {
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
    })
    .collect::<Vec<_>>();

  Ok(rows)
}
