use serde::Deserialize;
use serde_json::Value;

/// The value FAL sends to webhook endpoints.
#[derive(Deserialize, Debug, Clone)]
pub struct WebhookPayload {
  /// Value originally used in the queue API
  pub request_id: String,

  /// Mostly the same as `request_id`, but if the request failed and was retried,
  /// then gateway_request_id will have the value of the last tried request,
  /// while request_id will be the value used in the queue API.
  pub gateway_request_id: String,

  /// Status of the request: OK or ERROR.
  pub status: WebhookStatus,

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

#[derive(Deserialize, Debug, Clone, Copy)]
pub enum WebhookStatus {
  /// Success case
  #[serde(alias = "OK")]
  Ok,

  /// Failure case
  #[serde(alias = "ERROR")]
  Error
}
