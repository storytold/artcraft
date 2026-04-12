use serde_json::{Map, Value};

use crate::webhook_api::hydrated::hydrated_webhook_contents::ModelGlbData;

/// Extract and deserialize the `model_glb` key from a webhook success payload.
pub (crate) fn extract_model_glb(obj: &Map<String, Value>) -> Option<ModelGlbData> {
  let value = obj.get("model_glb")?;
  serde_json::from_value(value.clone()).ok()
}

#[cfg(test)]
mod tests {
  use super::*;

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
