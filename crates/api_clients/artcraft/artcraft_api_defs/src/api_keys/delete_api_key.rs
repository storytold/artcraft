use serde_derive::Serialize;
use utoipa::ToSchema;

// ── DELETE /v1/api_keys/{api_key_token} ──

#[derive(Serialize, ToSchema)]
pub struct DeleteApiKeySuccessResponse {
  pub success: bool,
}
