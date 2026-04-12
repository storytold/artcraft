use serde_json::{Map, Value};

/// Extract the `image` key from a webhook success payload object.
/// Returns a clone of the value if the key exists.
pub fn extract_image(obj: &Map<String, Value>) -> Option<Value> {
  obj.get("image").cloned()
}

#[cfg(test)]
mod tests {
  use crate::webhook_api::parse_webhook_inner_payload::parse_webhook_inner_payload;
  use crate::webhook_api::payload::webhook_inner_payload::WebhookInnerPayload;
  use crate::webhook_api::payload::webhook_payload::{WebhookPayload, WebhookStatus};

  fn load_test_webhook(filename: &str) -> WebhookPayload {
    let path = format!("test_data/webhooks/{}", filename);
    let json = std::fs::read_to_string(&path)
      .unwrap_or_else(|e| panic!("Failed to read {}: {}", path, e));
    serde_json::from_str(&json)
      .unwrap_or_else(|e| panic!("Failed to parse {}: {}", path, e))
  }

  #[test]
  fn images_payload_populates_images_field() {
    let webhook = load_test_webhook("success/images_payload_1.json");
    let result = parse_webhook_inner_payload(&webhook);

    let WebhookInnerPayload::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    // The raw payload should have "images".
    assert!(data.payload.get("images").is_some());

    // extracted_contents should be populated.
    let contents = data.extracted_contents
      .expect("extracted_contents should be Some for an images payload");

    // The "images" field should be an array with 2 items.
    let images = contents.images.expect("images should be Some");
    let images_arr = images.as_array().expect("images should be an array");
    assert_eq!(images_arr.len(), 2);

    // First image should have a url.
    let first = &images_arr[0];
    assert_eq!(
      first.get("url").and_then(|v| v.as_str()),
      Some("https://v3b.fal.media/files/b/01234567/name1.png"),
    );
    assert_eq!(
      first.get("content_type").and_then(|v| v.as_str()),
      Some("image/png"),
    );

    // Second image.
    let second = &images_arr[1];
    assert_eq!(
      second.get("url").and_then(|v| v.as_str()),
      Some("https://v3b.fal.media/files/b/01234567/name2.png"),
    );

    // The "image" (singular) field should be None since the payload has "images" not "image".
    assert!(contents.image.is_none());

    // The video/model fields should be None.
    assert!(contents.video.is_none());
    assert!(contents.model_glb.is_none());
    assert!(contents.model_mesh.is_none());
  }

  #[test]
  fn payload_without_known_keys_has_none_extracted_contents() {
    let webhook = WebhookPayload {
      request_id: "test-no-keys".to_string(),
      gateway_request_id: "test-no-keys".to_string(),
      status: WebhookStatus::Ok,
      error: None,
      payload: Some(serde_json::json!({"some_other_key": "value"})),
      payload_error: None,
    };

    let result = parse_webhook_inner_payload(&webhook);

    let WebhookInnerPayload::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    assert!(data.extracted_contents.is_none());
  }

  #[test]
  fn null_payload_has_none_extracted_contents() {
    let webhook = WebhookPayload {
      request_id: "test-null".to_string(),
      gateway_request_id: "test-null".to_string(),
      status: WebhookStatus::Ok,
      error: None,
      payload: None,
      payload_error: None,
    };

    let result = parse_webhook_inner_payload(&webhook);

    let WebhookInnerPayload::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    assert!(data.extracted_contents.is_none());
  }
}
