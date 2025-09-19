
use crate::prelude::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WebhookResponse {
  pub status: Option<String>,
  pub request_id: Option<String>,
  pub gateway_request_id: Option<String>,
}
