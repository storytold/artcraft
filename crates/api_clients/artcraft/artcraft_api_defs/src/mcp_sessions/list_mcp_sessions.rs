use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use crate::mcp_sessions::common::McpSessionInfo;

// ── GET /v1/mcp/session/list ──

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListMcpSessionsQueryParams {
  /// Page size. Defaults server-side if omitted.
  pub limit: Option<u32>,

  /// Number of rows to skip. Defaults to 0.
  pub offset: Option<u32>,
}

#[derive(Serialize, ToSchema)]
pub struct ListMcpSessionsSuccessResponse {
  pub success: bool,

  /// The user's MCP sessions (including terminated ones), newest first. The secret
  /// `private_session_token` is never listed.
  pub mcp_sessions: Vec<McpSessionInfo>,
}
