//! The raw, as-received shape of the JSON body that fal POSTs to a webhook URL when a queued job
//! finishes (successfully or not). The URL is the one given at submission time through
//! `FalRequest::queue_webhook`.
//!
//! "Raw" means nothing here has been interpreted yet. `parse_raw_webhook_payload` produces this
//! struct and `hydrate_webhook_contents` then turns it into a success, error or payload-error case.

// `Deserialize` lets serde build these types from the webhook JSON.
use serde::Deserialize;
// `Value` holds JSON whose shape differs per fal model, so it stays untyped here.
use serde_json::Value;

/// The value FAL sends to webhook endpoints.
#[derive(Deserialize, Debug, Clone)]
pub struct RawWebhookPayload {
  /// Value originally used in the queue API
  pub request_id: String,

  /// Mostly the same as `request_id`, but if the request failed and was retried,
  /// then gateway_request_id will have the value of the last tried request,
  /// while request_id will be the value used in the queue API.
  pub gateway_request_id: String,

  /// Status of the request: OK or ERROR.
  pub status: RawWebhookStatus,

  /// When an error happens, the status will be ERROR.
  /// The error property will contain a message and payload will contain the error details.
  /// eg. ""Invalid status code: 422"
  pub error: Option<String>,

  /// Payload of the webhook (typically present)
  /// THIS FIELD IS HIGHLY VARIABLE JSON.
  /// This is present for both *success* and *failure* cases,
  /// though the payload differs. Sometimes it is absent.
  pub payload: Option<Value>,

  /// In rare instances, if there was an error encoding the payload,
  /// this may be set. This can seemingly be set on "OK" responses.
  pub payload_error: Option<String>,
}

/// The top-level `status` field of the webhook: did fal run the job successfully or not.
///
/// fal sends the text as uppercase `"OK"` or `"ERROR"`; the `alias` attributes below let serde
/// accept those spellings for the Rust variant names.
#[derive(Deserialize, Debug, Clone, Copy)]
pub enum RawWebhookStatus {
  /// Success case
  #[serde(alias = "OK")]
  Ok,

  /// Failure case
  #[serde(alias = "ERROR")]
  Error
}
