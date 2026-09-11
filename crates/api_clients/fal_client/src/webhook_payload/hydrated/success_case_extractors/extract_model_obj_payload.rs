use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::ModelObjData;

/// Extract and deserialize the `model_obj` key from a webhook success payload.
pub (crate) fn extract_model_obj(obj: &Map<String, Value>) -> Option<ModelObjData> {
  let value = obj.get("model_obj")?;
  serde_json::from_value(value.clone()).ok()
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn synthetic_model_obj_payload() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_obj": {
        "url": "https://cdn.example.com/model.obj",
        "content_type": "model/obj",
        "file_name": "model.obj",
        "file_size": 654321
      }
    }"#).unwrap();

    let model_obj = extract_model_obj(&obj).expect("should extract model_obj");
    assert_eq!(model_obj.url.as_deref(), Some("https://cdn.example.com/model.obj"));
    assert_eq!(model_obj.content_type.as_deref(), Some("model/obj"));
    assert_eq!(model_obj.file_name.as_deref(), Some("model.obj"));
    assert_eq!(model_obj.file_size, Some(654321));
  }

  #[test]
  fn model_obj_url_only() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_obj": {"url": "https://cdn.example.com/m.obj"}
    }"#).unwrap();

    let model_obj = extract_model_obj(&obj).expect("should extract model_obj");
    assert_eq!(model_obj.url.as_deref(), Some("https://cdn.example.com/m.obj"));
    assert!(model_obj.content_type.is_none());
  }

  #[test]
  fn missing_model_obj_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_mesh": {"url": "https://example.com/mesh.glb"}
    }"#).unwrap();

    assert!(extract_model_obj(&obj).is_none());
  }
}
