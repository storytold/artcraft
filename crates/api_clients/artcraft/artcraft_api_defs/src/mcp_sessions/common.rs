use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::mcp_sessions::McpSessionToken;

/// Canonical wire shape for an MCP session, used by the dashboard list.
///
/// NB: the secret `private_session_token` is NEVER included here — it is returned exactly once,
/// at creation time. The `token` is the non-private management handle.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct McpSessionInfo {
  pub token: McpSessionToken,

  /// Trimmed name of the MCP client that created the session, if any.
  pub maybe_mcp_client_name: Option<String>,

  /// Trimmed version of the MCP client, if any.
  pub maybe_mcp_client_version: Option<String>,

  /// Trimmed vendor of the MCP client, if any.
  pub maybe_mcp_client_vendor: Option<String>,

  pub ip_address_creation: String,
  pub ip_address_update: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  /// When the session expires, if not refreshed.
  pub expires_at: DateTime<Utc>,

  /// Termination timestamp. `None` for live (though possibly expired) sessions.
  pub maybe_deleted_at: Option<DateTime<Utc>>,
}

/// Path info for endpoints addressed by the session's management `token` (NOT the secret
/// `private_session_token`): `POST /v1/mcp/session/{token}/delete`.
#[derive(Deserialize, ToSchema)]
pub struct McpSessionPathInfo {
  pub token: McpSessionToken,
}
