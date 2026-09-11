use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct EditUsernameRequest {
  pub display_name: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct EditUsernameResponse {
  pub success: bool,
}
