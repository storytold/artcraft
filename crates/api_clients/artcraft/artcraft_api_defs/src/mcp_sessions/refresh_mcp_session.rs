use serde_derive::Serialize;
use utoipa::ToSchema;

// ── POST /v1/mcp/session/refresh ──

#[derive(Serialize, ToSchema)]
pub struct RefreshMcpSessionSuccessResponse {
  pub success: bool,
}
