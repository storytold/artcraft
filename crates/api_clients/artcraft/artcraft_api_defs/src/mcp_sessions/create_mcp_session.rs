use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::mcp_session_private::McpSessionPrivateToken;

// ── POST /v1/mcp/session/create ──

#[derive(Deserialize, ToSchema)]
pub struct CreateMcpSessionRequest {
  /// Name of the MCP client creating the session, if any.
  pub maybe_mcp_client_name: Option<String>,

  /// Version of the MCP client, if any.
  pub maybe_mcp_client_version: Option<String>,

  /// Vendor of the MCP client, if any.
  pub maybe_mcp_client_vendor: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct CreateMcpSessionSuccessResponse {
  pub success: bool,

  /// The secret credential the MCP client presents in the `Authorization` header. This is the
  /// ONLY time it is ever returned — the caller must store it now, as it cannot be retrieved
  /// again.
  pub private_session_token: McpSessionPrivateToken,
}
