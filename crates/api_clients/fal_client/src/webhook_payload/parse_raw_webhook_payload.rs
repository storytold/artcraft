use crate::webhook_payload::raw::raw_webhook_payload::RawWebhookPayload;

pub fn parse_raw_webhook_payload(json: &str) -> Result<RawWebhookPayload, serde_json::Error> {
  serde_json::from_str(json)
}
