use serde_json::{Map, Value};

/// Extract the `image` key from a webhook success payload object.
/// Returns a clone of the value if the key exists.
pub fn extract_image(obj: &Map<String, Value>) -> Option<Value> {
  obj.get("image").cloned()
}

#[cfg(test)]
mod tests {
  use crate::webhook_api::hydrate_webhook_contents::hydrate_webhook_contents;
  use crate::webhook_api::hydrated::hydrated_webhook_contents::HydratedWebhookContents;
  use crate::webhook_api::raw::raw_webhook_payload::{RawWebhookPayload, RawWebhookStatus};

  #[test]
  fn payload_without_known_keys_has_none_extracted_contents() {
    let webhook = RawWebhookPayload {
      request_id: "test-no-keys".to_string(),
      gateway_request_id: "test-no-keys".to_string(),
      status: RawWebhookStatus::Ok,
      error: None,
      payload: Some(serde_json::json!({"some_other_key": "value"})),
      payload_error: None,
    };

    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    assert!(data.extracted_contents.is_none());
  }

  #[test]
  fn null_payload_has_none_extracted_contents() {
    let webhook = RawWebhookPayload {
      request_id: "test-null".to_string(),
      gateway_request_id: "test-null".to_string(),
      status: RawWebhookStatus::Ok,
      error: None,
      payload: None,
      payload_error: None,
    };

    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    assert!(data.extracted_contents.is_none());
  }
}
