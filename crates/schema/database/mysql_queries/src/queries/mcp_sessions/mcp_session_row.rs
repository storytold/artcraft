use chrono::{DateTime, Utc};

use tokens::tokens::mcp_sessions::McpSessionToken;
use tokens::tokens::users::UserToken;

/// A materialized `mcp_sessions` row, minus the internal `id` and the secret
/// `private_session_token`. The private credential is returned exactly once, at creation time,
/// and is never selected back out of the database.
#[derive(Debug, Clone)]
pub struct McpSessionRow {
  pub token: McpSessionToken,

  pub user_token: UserToken,

  pub maybe_mcp_client_name: Option<String>,
  pub maybe_mcp_client_version: Option<String>,
  pub maybe_mcp_client_vendor: Option<String>,

  pub ip_address_creation: String,
  pub ip_address_update: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  /// When the session expires, if not refreshed.
  pub expires_at: DateTime<Utc>,

  /// Soft-delete (termination) timestamp. `None` for live sessions.
  pub maybe_deleted_at: Option<DateTime<Utc>>,
}
