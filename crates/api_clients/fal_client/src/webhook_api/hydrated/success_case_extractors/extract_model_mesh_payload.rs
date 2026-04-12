use serde_json::{Map, Value};

use crate::webhook_api::hydrated::hydrated_webhook_contents::ModelMeshData;

/// Extract and deserialize the `model_mesh` key from a webhook success payload.
pub (crate) fn extract_model_mesh(obj: &Map<String, Value>) -> Option<ModelMeshData> {
  let value = obj.get("model_mesh")?;
  serde_json::from_value(value.clone()).ok()
}

#[cfg(test)]
mod tests {
  use super::*;

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
