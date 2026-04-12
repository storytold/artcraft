use serde_json::Value;

use crate::webhook_api::payload::webhook_error_type::WebhookErrorType;

/// The parsed inner payload of a FAL webhook.
#[derive(Debug)]
pub enum WebhookInnerPayload {
  /// The webhook reported success and has a payload.
  Success(SuccessData),

  /// The webhook reported an error (status=ERROR) with optional detail info.
  Error(ErrorData),

  /// The webhook reported as "success" but (1) had no payload and (2) had a payload_error.
  /// In rare instances of an "OK" response, there may be an error on Fal's end with encoding
  /// the payload. If that happens, the "payload_error" field may be set, and this enum variant
  /// represents that failure case.
  PayloadError(PayloadErrorData),
}

#[derive(Debug)]
pub struct SuccessData {
  /// The success data is polymorphic, so we're returning a JSON `Value` for now.
  /// This will allow for downstream handlers to parse the payload as needed.
  /// This is the entire raw success payload.
  pub payload: Value,
  
  /// If there are any extracted sub-payload contents, such as "images" or "video",
  /// then they are included here. This may not be fully inclusive of future 
  /// payload types.
  pub extracted_contents: ExtractedContents,
}

#[derive(Debug)]
pub struct ExtractedContents {
  /// If the `payload` is a JSON object with the key `image`,
  /// then the data in `['payload']['image']` is represented here:
  pub image: Option<Value>,

  /// If the `payload` is a JSON object with the key `images`,
  /// then the data in `['payload']['images']` is represented here:
  pub images: Option<Value>,

  /// If the `payload` is a JSON object with the key `video`,
  /// then the data in `['payload']['video']` is represented here:
  pub video: Option<Value>,

  /// If the `payload` is a JSON object with the key `model_glb`,
  /// then the data in `['payload']['model_glb']` is represented here:
  pub model_glb: Option<Value>,

  /// If the `payload` is a JSON object with the key `model_mesh`,
  /// then the data in `['payload']['model_mesh']` is represented here:
  pub model_mesh: Option<Value>,
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
