use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct SimpleGenericJsonSuccess {
  pub success: bool,
}
