use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::ImageData;

/// Extract and deserialize the `image` key from a webhook success payload.
pub (crate) fn extract_image(obj: &Map<String, Value>) -> Option<ImageData> {
  let value = obj.get("image")?;
  serde_json::from_value(value.clone()).ok()
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::webhook_payload::hydrate_webhook_contents::hydrate_webhook_contents;
  use crate::webhook_payload::hydrated::hydrated_webhook_contents::HydratedWebhookContents;
  use crate::webhook_payload::raw::raw_webhook_payload::{RawWebhookPayload, RawWebhookStatus};

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

  #[test]
  fn synthetic_image_payload() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "image": {
        "url": "https://cdn.example.com/single.png",
        "content_type": "image/png",
        "file_name": "single.png",
        "file_size": 98765,
        "width": 512,
        "height": 512
      }
    }"#).unwrap();

    let image = extract_image(&obj).expect("should extract image");
    assert_eq!(image.url.as_deref(), Some("https://cdn.example.com/single.png"));
    assert_eq!(image.content_type.as_deref(), Some("image/png"));
    assert_eq!(image.file_name.as_deref(), Some("single.png"));
    assert_eq!(image.file_size, Some(98765));
    assert_eq!(image.width, Some(512));
    assert_eq!(image.height, Some(512));
  }

  #[test]
  fn synthetic_image_url_only() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "image": {"url": "https://cdn.example.com/img.jpg"}
    }"#).unwrap();

    let image = extract_image(&obj).expect("should extract image");
    assert_eq!(image.url.as_deref(), Some("https://cdn.example.com/img.jpg"));
    assert!(image.content_type.is_none());
    assert!(image.file_size.is_none());
  }

  #[test]
  fn missing_image_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "images": [{"url": "https://example.com/img.png"}]
    }"#).unwrap();

    assert!(extract_image(&obj).is_none());
  }
}
