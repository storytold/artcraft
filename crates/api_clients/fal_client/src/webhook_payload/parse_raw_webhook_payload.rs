//! First step of handling a fal webhook: turn the JSON text fal POSTed into a typed struct.
//!
//! The second step is `hydrate_webhook_contents`, which interprets the parsed struct.
//! Nothing outside this crate calls this function in the ArtCraft repo; it is a library entry
//! point for whatever server receives the webhook.

// The typed shape of the outer webhook envelope (request ids, status, payload).
use crate::webhook_payload::raw::raw_webhook_payload::RawWebhookPayload;

/// Parses the raw JSON body of a fal webhook into a `RawWebhookPayload`.
///
/// `json` is the exact request body text fal sent. Returns the `serde_json::Error` if the text is
/// not valid JSON or is missing a required field (`request_id`, `gateway_request_id`, `status`).
/// The inner `payload` is left as untyped JSON; see `hydrate_webhook_contents` for that.
pub fn parse_raw_webhook_payload(json: &str) -> Result<RawWebhookPayload, serde_json::Error> {
  serde_json::from_str(json)
}
