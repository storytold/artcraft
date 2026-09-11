use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ChangePasswordRequest {
  pub password: String,
  pub password_confirmation: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ChangePasswordResponse {
  pub success: bool,
}
