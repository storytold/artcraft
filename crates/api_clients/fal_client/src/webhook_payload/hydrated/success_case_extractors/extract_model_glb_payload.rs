use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::ModelGlbData;

/// Extract and deserialize the `model_glb` key from a webhook success payload.
pub (crate) fn extract_model_glb(obj: &Map<String, Value>) -> Option<ModelGlbData> {
  let value = obj.get("model_glb")?;
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
  fn model_glb_from_test_file() {
    let webhook = load_test_webhook("success/model_glb_urls_and_thumbnail_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some");

    let glb = contents.model_glb.expect("model_glb should be Some");
    assert_eq!(glb.url.as_deref(), Some("https://v3b.fal.media/files/b/0a95eb37/f7UaAhyfcx0BAnYy0GpFM_model.glb"));
    assert_eq!(glb.content_type.as_deref(), Some("model/gltf-binary"));
    assert_eq!(glb.file_name.as_deref(), Some("model.glb"));
    assert_eq!(glb.file_size, Some(66284788));

    // This payload also has a thumbnail.
    assert!(contents.thumbnail.is_some());

    // No image/images/video/mesh in this payload.
    assert!(contents.image.is_none());
    assert!(contents.images.is_none());
    assert!(contents.video.is_none());
    assert!(contents.model_mesh.is_none());
  }

  #[test]
  fn synthetic_model_glb_payload() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_glb": {
        "url": "https://cdn.example.com/model.glb",
        "content_type": "model/gltf-binary",
        "file_name": "output.glb",
        "file_size": 5432100
      }
    }"#).unwrap();

    let glb = extract_model_glb(&obj).expect("should extract model_glb");
    assert_eq!(glb.url.as_deref(), Some("https://cdn.example.com/model.glb"));
    assert_eq!(glb.content_type.as_deref(), Some("model/gltf-binary"));
    assert_eq!(glb.file_name.as_deref(), Some("output.glb"));
    assert_eq!(glb.file_size, Some(5432100));
  }

  #[test]
  fn model_glb_url_only() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_glb": {"url": "https://cdn.example.com/m.glb"}
    }"#).unwrap();

    let glb = extract_model_glb(&obj).expect("should extract model_glb");
    assert_eq!(glb.url.as_deref(), Some("https://cdn.example.com/m.glb"));
    assert!(glb.content_type.is_none());
  }

  #[test]
  fn missing_model_glb_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "video": {"url": "https://example.com/v.mp4"}
    }"#).unwrap();

    assert!(extract_model_glb(&obj).is_none());
  }
}
