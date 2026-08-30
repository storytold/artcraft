use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::mcp_session_refresh::McpSessionRefreshToken;

// ── POST /v1/mcp/session/refresh ──

#[derive(Deserialize, ToSchema)]
pub struct RefreshMcpSessionRequest {
  /// The session's CURRENT refresh token (from creation, or from the most recent refresh).
  /// A stale or wrong value is an error — refresh tokens rotate and are never replayable.
  pub private_refresh_token: McpSessionRefreshToken,
}

#[derive(Serialize, ToSchema)]
pub struct RefreshMcpSessionSuccessResponse {
  pub success: bool,

  /// The NEW refresh token to present on the next refresh. The one just used is now invalid —
  /// the caller must store this replacement.
  pub private_refresh_token: McpSessionRefreshToken,
}
