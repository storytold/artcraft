use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

// ── PUT /v1/api_keys/{api_key_token} ──

#[derive(Deserialize, ToSchema)]
pub struct UpdateApiKeyRequest {
  /// New description for the key. `None` clears it.
  pub maybe_description: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct UpdateApiKeySuccessResponse {
  pub success: bool,
}
