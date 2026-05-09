use serde_json::Value;

use crate::webhook_payload::raw::webhook_error_type::WebhookErrorType;
use crate::webhook_payload::hydrated::hydrated_webhook_contents::{ErrorData, PayloadErrorData, WebhookSuccessData, HydratedWebhookContents};
use crate::webhook_payload::raw::raw_webhook_payload::{RawWebhookPayload, RawWebhookStatus};
use crate::webhook_payload::hydrated::success_case_extractors::extract_contents_from_payload;

/// Parse the inner payload of a FAL webhook into one of three cases.
///
/// 1. If status is ERROR, parse out the first `detail` entry's `msg` and `type`.
/// 2. If status is OK but there's no payload and there is a `payload_error`, return PayloadError.
/// 3. Otherwise, return Success with the payload.
pub fn hydrate_webhook_contents(webhook: &RawWebhookPayload) -> HydratedWebhookContents {
  match webhook.status {
    RawWebhookStatus::Error => {
      let (message, error_type) = extract_error_first_detail(&webhook.payload);

      HydratedWebhookContents::Error(ErrorData {
        message,
        error_type,
      })
    }
    RawWebhookStatus::Ok => {
      // Check for `payload_error` case: status=OK but no payload, has payload_error.
      if webhook.payload.is_none() {
        if let Some(ref payload_error) = webhook.payload_error {
          return HydratedWebhookContents::PayloadError(PayloadErrorData {
            payload_error: payload_error.clone(),
          });
        }
      }

      let value = webhook.payload
          .clone()
          .unwrap_or(Value::Null);

      let extracted_contents = extract_contents_from_payload(&value);

      HydratedWebhookContents::Success(WebhookSuccessData {
        payload: value,
        extracted_contents,
      })
    }
  }
}

/// Extract the first `msg` and `type` from `payload.detail[]`.
fn extract_error_first_detail(payload: &Option<Value>) -> (Option<String>, Option<WebhookErrorType>) {
  let payload = match payload {
    Some(p) => p,
    None => return (None, None),
  };

  let detail_array = match payload.get("detail").and_then(|v| v.as_array()) {
    Some(arr) => arr,
    None => return (None, None),
  };

  let first = match detail_array.first() {
    Some(item) => item,
    None => return (None, None),
  };

  let message = first.get("msg").and_then(|v| v.as_str()).map(|s| s.to_string());

  let error_type = first
      .get("type")
      .and_then(|v| v.as_str())
      .map(WebhookErrorType::from_str);

  (message, error_type)
}

#[cfg(test)]
mod tests {
  use super::*;

  fn load_test_webhook(filename: &str) -> RawWebhookPayload {
    let path = format!("test_data/webhooks/{}", filename);
    let json = std::fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", path, e));
    serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("Failed to parse {}: {}", path, e))
  }

  #[test]
  fn gpt_image_1p5_content_policy_violation() {
    let webhook = load_test_webhook("failure/gpt_image_1p5_fail_content_policy.json");
    let result = hydrate_webhook_contents(&webhook);

    match result {
      HydratedWebhookContents::Error(data) => {
        assert_eq!(
          data.error_type,
          Some(WebhookErrorType::ContentPolicyViolation),
        );
        assert_eq!(
          data.message.as_deref(),
          Some("The content could not be processed because it contained material flagged by a content checker."),
        );
      }
      other => panic!("Expected HydratedWebhookContents::Error, got {:?}", other),
    }
  }

  #[test]
  fn gpt_image_invalid_api_key() {
    let webhook = load_test_webhook("failure/gpt_image_fail_invalid_api_key.json");
    let result = hydrate_webhook_contents(&webhook);

    match result {
      HydratedWebhookContents::Error(data) => {
        assert_eq!(
          data.error_type,
          Some(WebhookErrorType::InvalidApiKey),
        );
        assert_eq!(
          data.message.as_deref(),
          Some("Invalid API key"),
        );
      }
      other => panic!("Expected HydratedWebhookContents::Error, got {:?}", other),
    }
  }

  #[test]
  fn kling_1p6_pro_file_too_large() {
    let webhook = load_test_webhook("failure/kling_1p6_pro_file_too_large_error.json");
    let result = hydrate_webhook_contents(&webhook);

    match result {
      HydratedWebhookContents::Error(data) => {
        assert_eq!(
          data.error_type,
          Some(WebhookErrorType::FileTooLarge),
        );
        assert_eq!(
          data.message.as_deref(),
          Some("File size exceeds the maximum allowed size of 10485760 bytes. Please upload a smaller file."),
        );
      }
      other => panic!("Expected HydratedWebhookContents::Error, got {:?}", other),
    }
  }

  #[test]
  fn kling_3p0_pro_content_policy_violation() {
    let webhook = load_test_webhook("failure/kling_3p0_pro_fail_content_policy.json");
    let result = hydrate_webhook_contents(&webhook);

    match result {
      HydratedWebhookContents::Error(data) => {
        assert_eq!(
          data.error_type,
          Some(WebhookErrorType::ContentPolicyViolation),
        );
        assert_eq!(
          data.message.as_deref(),
          Some("The content could not be processed because it contained material flagged by a content checker."),
        );
      }
      other => panic!("Expected HydratedWebhookContents::Error, got {:?}", other),
    }
  }

  #[test]
  fn nano_banana_pro_no_media_generated() {
    let webhook = load_test_webhook("failure/nano_banana_pro_fail_no_media_generated.json");
    let result = hydrate_webhook_contents(&webhook);

    match result {
      HydratedWebhookContents::Error(data) => {
        assert_eq!(
          data.error_type,
          Some(WebhookErrorType::NoMediaGenerated),
        );
        assert!(
          data.message.as_deref().unwrap().starts_with("The model did not generate"),
        );
      }
      other => panic!("Expected HydratedWebhookContents::Error, got {:?}", other),
    }
  }

  #[test]
  fn payload_error_case() {
    let webhook = RawWebhookPayload {
      request_id: "test-123".to_string(),
      gateway_request_id: "test-123".to_string(),
      status: RawWebhookStatus::Ok,
      error: None,
      payload: None,
      payload_error: Some("encoding error occurred".to_string()),
    };

    let result = hydrate_webhook_contents(&webhook);

    match result {
      HydratedWebhookContents::PayloadError(data) => {
        assert_eq!(data.payload_error, "encoding error occurred");
      }
      other => panic!("Expected HydratedWebhookContents::PayloadError, got {:?}", other),
    }
  }

  #[test]
  fn success_case() {
    let webhook = RawWebhookPayload {
      request_id: "test-456".to_string(),
      gateway_request_id: "test-456".to_string(),
      status: RawWebhookStatus::Ok,
      error: None,
      payload: Some(serde_json::json!({"images": [{"url": "https://example.com/img.png"}]})),
      payload_error: None,
    };

    let result = hydrate_webhook_contents(&webhook);

    match result {
      HydratedWebhookContents::Success(data) => {
        assert!(data.payload.get("images").is_some());
      }
      other => panic!("Expected HydratedWebhookContents::Success, got {:?}", other),
    }
  }

  #[test]
  fn seedream_partner_validation_failed() {
    let webhook = load_test_webhook("failure/seedream_partner_validation_failed.json");
    let result = hydrate_webhook_contents(&webhook);

    match result {
      HydratedWebhookContents::Error(data) => {
        assert_eq!(
          data.error_type,
          Some(WebhookErrorType::ContentPolicyViolation),
        );
        assert_eq!(
          data.message.as_deref(),
          Some("The content could not be processed because it contained material flagged by a content checker."),
        );
      }
      other => panic!("Expected HydratedWebhookContents::Error, got {:?}", other),
    }
  }

  #[test]
  fn error_with_no_payload() {
    let webhook = RawWebhookPayload {
      request_id: "test-789".to_string(),
      gateway_request_id: "test-789".to_string(),
      status: RawWebhookStatus::Error,
      error: Some("Internal server error".to_string()),
      payload: None,
      payload_error: None,
    };

    let result = hydrate_webhook_contents(&webhook);

    match result {
      HydratedWebhookContents::Error(data) => {
        assert_eq!(data.message, None);
        assert_eq!(data.error_type, None);
      }
      other => panic!("Expected HydratedWebhookContents::Error, got {:?}", other),
    }
  }
}
