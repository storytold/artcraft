use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::mcp_session_private::McpSessionPrivateToken;
use tokens::tokens::mcp_session_refresh::McpSessionRefreshToken;
use tokens::tokens::mcp_sessions::McpSessionToken;
use tokens::tokens::users::UserToken;

/// How long a freshly created (or refreshed) MCP session lives without a refresh.
pub const MCP_SESSION_LIFETIME_DAYS: u16 = 14;

pub struct InsertMcpSessionArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub user_token: &'e UserToken,
  pub ip_address: &'e str,
  pub maybe_mcp_client_name: Option<&'e str>,
  pub maybe_mcp_client_version: Option<&'e str>,
  pub maybe_mcp_client_vendor: Option<&'e str>,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// The tokens minted by [`insert_mcp_session`]. The private session and refresh tokens are
/// handed to the caller exactly once, here — they are never selected back out of the database.
pub struct InsertedMcpSession {
  pub token: McpSessionToken,
  pub private_session_token: McpSessionPrivateToken,
  pub private_refresh_token: McpSessionRefreshToken,
}

/// Insert a new MCP session. The management `token`, the secret `private_session_token`, and
/// the initial `private_refresh_token` are all minted here (in the data-access layer, not the
/// handler) and returned to the caller. The provided IP address is stamped on both the creation
/// and update IP columns, and the session expires [`MCP_SESSION_LIFETIME_DAYS`] days out from
/// MySQL `NOW()` unless refreshed.
pub async fn insert_mcp_session<'e, 'c: 'e, E>(
  args: InsertMcpSessionArgs<'e, 'c, E>,
) -> Result<InsertedMcpSession, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let token = McpSessionToken::generate();
  let private_session_token = McpSessionPrivateToken::generate();
  let private_refresh_token = McpSessionRefreshToken::generate();

  sqlx::query!(
    r#"
INSERT INTO mcp_sessions
SET
  token = ?,
  private_session_token = ?,
  private_refresh_token = ?,
  user_token = ?,
  maybe_mcp_client_name = ?,
  maybe_mcp_client_version = ?,
  maybe_mcp_client_vendor = ?,
  ip_address_creation = ?,
  ip_address_update = ?,
  created_at = NOW(),
  expires_at = NOW() + INTERVAL ? DAY
    "#,
    token.as_str(),
    private_session_token.as_str(),
    private_refresh_token.as_str(),
    args.user_token.as_str(),
    args.maybe_mcp_client_name,
    args.maybe_mcp_client_version,
    args.maybe_mcp_client_vendor,
    args.ip_address,
    args.ip_address,
    MCP_SESSION_LIFETIME_DAYS,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(InsertedMcpSession {
    token,
    private_session_token,
    private_refresh_token,
  })
}
