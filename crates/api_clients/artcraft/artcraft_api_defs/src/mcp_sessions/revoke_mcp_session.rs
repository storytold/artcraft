use serde_derive::Serialize;
use utoipa::ToSchema;

// ── POST /v1/mcp/session/revoke ──

#[derive(Serialize, ToSchema)]
pub struct RevokeMcpSessionSuccessResponse {
  pub success: bool,
}
