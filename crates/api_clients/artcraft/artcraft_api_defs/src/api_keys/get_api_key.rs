use serde_derive::Serialize;
use utoipa::ToSchema;

use crate::api_keys::common::ApiKeyInfo;

// ── GET /v1/api_keys/{api_key_token} ──

#[derive(Serialize, ToSchema)]
pub struct GetApiKeySuccessResponse {
  pub success: bool,
  pub api_key: ApiKeyInfo,
}
