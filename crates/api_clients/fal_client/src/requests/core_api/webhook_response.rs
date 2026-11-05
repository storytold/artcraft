//! The JSON fal returns when a job is submitted with a webhook URL
//! (`FalRequest::queue_webhook`). The finished result arrives later via that webhook.

use serde::{Deserialize, Serialize};

/// Acknowledgement of a webhook-style submission. Every field is optional because fal
/// does not always send all of them.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WebhookResponse {
  /// Queue status text, e.g. "IN_QUEUE".
  pub status: Option<String>,
  /// fal's id for the job; the webhook payload will carry the same id.
  pub request_id: Option<String>,
  /// Id assigned by fal's gateway (useful when reporting problems to fal).
  pub gateway_request_id: Option<String>,
}
