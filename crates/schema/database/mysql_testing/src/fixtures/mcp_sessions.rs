//! MCP session fixtures: real `mcp_sessions` rows created via the production
//! insert query, plus test-only mutators for states the production queries
//! never produce (e.g. an already-expired session).

use std::marker::PhantomData;

use anyhow::anyhow;
use sqlx::MySqlPool;

use mysql_queries::queries::mcp_sessions::insert_mcp_session::{
  insert_mcp_session, InsertMcpSessionArgs, InsertedMcpSession,
};
use tokens::tokens::mcp_sessions::McpSessionToken;
use tokens::tokens::users::UserToken;

const TEST_IP_ADDRESS: &str = "127.0.0.1";

/// Create a live MCP session for the user via the production insert query.
/// Returns both minted tokens (the management token and the private credential).
pub async fn create_test_mcp_session(
  pool: &MySqlPool,
  user_token: &UserToken,
) -> anyhow::Result<InsertedMcpSession> {
  let mut connection = pool.acquire().await?;

  insert_mcp_session(InsertMcpSessionArgs {
    user_token,
    ip_address: TEST_IP_ADDRESS,
    maybe_mcp_client_name: Some("test mcp client"),
    maybe_mcp_client_version: None,
    maybe_mcp_client_vendor: None,
    mysql_executor: &mut *connection,
    phantom: PhantomData,
  })
  .await
  .map_err(|err| anyhow!("insert_mcp_session failed: {err:?}"))
}

/// Push a session's `expires_at` into the past. Production queries can never
/// produce an expired-from-birth session, so tests exercising expiry set it
/// directly.
pub async fn force_expire_mcp_session(
  pool: &MySqlPool,
  token: &McpSessionToken,
) -> anyhow::Result<()> {
  sqlx::query("UPDATE mcp_sessions SET expires_at = NOW() - INTERVAL 1 DAY WHERE token = ?")
    .bind(token.as_str())
    .execute(pool)
    .await?;
  Ok(())
}
