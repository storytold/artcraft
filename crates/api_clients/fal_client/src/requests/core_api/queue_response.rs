use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct QueueResponse {
  pub request_id: String,
  pub response_url: String,
  pub status_url: String,
  pub cancel_url: String,
}
