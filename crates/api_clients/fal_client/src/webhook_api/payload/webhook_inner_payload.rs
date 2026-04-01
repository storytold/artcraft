use serde_json::Value;

use crate::webhook_api::payload::webhook_error_type::WebhookErrorType;

/// The parsed inner payload of a FAL webhook.
#[derive(Debug)]
pub enum WebhookInnerPayload {
  /// The webhook reported success and has a payload.
  Success(SuccessData),
  /// The webhook reported an error (status=ERROR) with optional detail info.
  Error(ErrorData),
  /// The webhook reported success but had no payload and instead had a payload_error.
  PayloadError(PayloadErrorData),
}

#[derive(Debug)]
pub struct SuccessData {
  pub payload: Value,
}

#[derive(Debug)]
pub struct ErrorData {
  /// The first human-readable message from `payload.detail[].msg`, if any.
  pub message: Option<String>,
  /// The first machine-readable error type from `payload.detail[].type`, if any.
  pub error_type: Option<WebhookErrorType>,
}

#[derive(Debug)]
pub struct PayloadErrorData {
  pub payload_error: String,
}
