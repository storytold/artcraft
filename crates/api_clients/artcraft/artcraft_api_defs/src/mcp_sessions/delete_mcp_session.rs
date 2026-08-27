use serde_derive::Serialize;
use utoipa::ToSchema;

// ── POST /v1/mcp/session/{token}/delete ──

#[derive(Serialize, ToSchema)]
pub struct DeleteMcpSessionSuccessResponse {
  pub success: bool,
}
