use crate::webhook_api::payload::webhook_payload::WebhookPayload;

pub fn parse_webhook_payload(json: &str) -> Result<WebhookPayload, serde_json::Error> {
  serde_json::from_str(json)
}
