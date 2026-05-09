use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::ModelMeshData;

/// Extract and deserialize the `model_mesh` key from a webhook success payload.
pub (crate) fn extract_model_mesh(obj: &Map<String, Value>) -> Option<ModelMeshData> {
  let value = obj.get("model_mesh")?;
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
  fn model_mesh_from_test_file() {
    let webhook = load_test_webhook("success/model_mesh_payload_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some");

    let mesh = contents.model_mesh.expect("model_mesh should be Some");
    assert_eq!(mesh.url.as_deref(), Some("https://v3b.fal.media/files/b/0a95eb2d/XCpH7fk-tZVXr1XMUr7DY_mesh-1775972273-765284.glb"));
    assert_eq!(mesh.content_type.as_deref(), Some("application/octet-stream"));
    assert_eq!(mesh.file_name.as_deref(), Some("mesh-1775972273-765284.glb"));
    assert_eq!(mesh.file_size, Some(3886928));

    // No other content types in this payload.
    assert!(contents.image.is_none());
    assert!(contents.images.is_none());
    assert!(contents.video.is_none());
    assert!(contents.model_glb.is_none());
    assert!(contents.thumbnail.is_none());
  }

  #[test]
  fn synthetic_model_mesh_payload() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_mesh": {
        "url": "https://cdn.example.com/mesh.obj",
        "content_type": "model/obj",
        "file_name": "output.obj",
        "file_size": 1234567
      }
    }"#).unwrap();

    let mesh = extract_model_mesh(&obj).expect("should extract model_mesh");
    assert_eq!(mesh.url.as_deref(), Some("https://cdn.example.com/mesh.obj"));
    assert_eq!(mesh.content_type.as_deref(), Some("model/obj"));
    assert_eq!(mesh.file_name.as_deref(), Some("output.obj"));
    assert_eq!(mesh.file_size, Some(1234567));
  }

  #[test]
  fn model_mesh_url_only() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_mesh": {"url": "https://cdn.example.com/m.obj"}
    }"#).unwrap();

    let mesh = extract_model_mesh(&obj).expect("should extract model_mesh");
    assert_eq!(mesh.url.as_deref(), Some("https://cdn.example.com/m.obj"));
    assert!(mesh.content_type.is_none());
  }

  #[test]
  fn missing_model_mesh_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "image": {"url": "https://example.com/img.png"}
    }"#).unwrap();

    assert!(extract_model_mesh(&obj).is_none());
  }
}
