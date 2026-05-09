use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::ThumbnailData;

/// Extract and deserialize the `thumbnail` key from a webhook success payload.
pub(crate) fn extract_thumbnail(obj: &Map<String, Value>) -> Option<ThumbnailData> {
  let value = obj.get("thumbnail")?;
  serde_json::from_value(value.clone()).ok()
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::webhook_payload::hydrate_webhook_contents::hydrate_webhook_contents;
  use crate::webhook_payload::hydrated::hydrated_webhook_contents::HydratedWebhookContents;
  use crate::webhook_payload::raw::raw_webhook_payload::RawWebhookPayload;

  fn load_test_webhook(filename: &str) -> RawWebhookPayload {
    let path = format!("test_data/webhooks/{}", filename);
    let json = std::fs::read_to_string(&path)
      .unwrap_or_else(|e| panic!("Failed to read {}: {}", path, e));
    serde_json::from_str(&json)
      .unwrap_or_else(|e| panic!("Failed to parse {}: {}", path, e))
  }

  #[test]
  fn thumbnail_from_model_glb_test_file() {
    let webhook = load_test_webhook("success/model_glb_urls_and_thumbnail_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some");

    let thumbnail = contents.thumbnail.expect("thumbnail should be Some");
    assert_eq!(thumbnail.url.as_deref(), Some("https://v3b.fal.media/files/b/0a95eb38/yvwGJWZV9TkWZuZvjxZNj_preview.png"));
    assert_eq!(thumbnail.content_type.as_deref(), Some("image/png"));
    assert_eq!(thumbnail.file_name.as_deref(), Some("preview.png"));
    assert_eq!(thumbnail.file_size, Some(93436));
  }

  #[test]
  fn synthetic_thumbnail_payload() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "thumbnail": {
        "url": "https://cdn.example.com/thumb.png",
        "content_type": "image/png",
        "file_name": "thumb.png",
        "file_size": 12345
      }
    }"#).unwrap();

    let thumb = extract_thumbnail(&obj).expect("should extract thumbnail");
    assert_eq!(thumb.url.as_deref(), Some("https://cdn.example.com/thumb.png"));
    assert_eq!(thumb.content_type.as_deref(), Some("image/png"));
    assert_eq!(thumb.file_name.as_deref(), Some("thumb.png"));
    assert_eq!(thumb.file_size, Some(12345));
  }

  #[test]
  fn missing_thumbnail_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_glb": {"url": "https://example.com/model.glb"}
    }"#).unwrap();

    assert!(extract_thumbnail(&obj).is_none());
  }

  #[test]
  fn model_mesh_payload_has_no_thumbnail() {
    let webhook = load_test_webhook("success/model_mesh_payload_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some");

    assert!(contents.thumbnail.is_none());
  }
}
