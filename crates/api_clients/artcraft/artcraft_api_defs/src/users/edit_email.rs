use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct EditEmailRequest {
  pub email_address: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct EditEmailResponse {
  pub success: bool,
}
