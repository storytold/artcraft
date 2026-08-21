use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::ModelGlbData;

/// Extract and deserialize the `model_glb_pbr` key from a webhook success
/// payload. Sent alongside `model_glb` by e.g. Hunyuan 3D 2.1; same shape.
pub(crate) fn extract_model_glb_pbr(obj: &Map<String, Value>) -> Option<ModelGlbData> {
  let value = obj.get("model_glb_pbr")?;
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
  fn model_glbs_from_hunyuan_3d_2p1_test_file() {
    let webhook = load_test_webhook("success/hunyuan_3d_2p1_model_glbs_payload_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some");

    let glb = contents.model_glb.expect("model_glb should be Some");
    assert_eq!(glb.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1b916/QKdBTd8WJW_rtPB3IwlEN_demo_textured.glb"));
    assert_eq!(glb.content_type.as_deref(), Some("application/octet-stream"));
    assert_eq!(glb.file_name.as_deref(), Some("demo_textured.glb"));
    assert_eq!(glb.file_size, Some(1574216));

    let glb_pbr = contents.model_glb_pbr.expect("model_glb_pbr should be Some");
    assert_eq!(glb_pbr.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1b921/SJw7AARzkc4l9QG5Lrvmu_demo_textured_pbr.glb"));
    assert_eq!(glb_pbr.content_type.as_deref(), Some("application/octet-stream"));
    assert_eq!(glb_pbr.file_name.as_deref(), Some("demo_textured_pbr.glb"));
    assert_eq!(glb_pbr.file_size, Some(7512760));

    // The payload also carries a `model_mesh` zip archive of the whole
    // generation. It parses out, but the webhook handler prefers the GLBs.
    let mesh = contents.model_mesh.expect("model_mesh should be Some");
    assert_eq!(mesh.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1b915/B25DrTdiZJNV-60RaUh4u_3d_model.zip"));
    assert_eq!(mesh.file_name.as_deref(), Some("3d_model.zip"));

    assert!(contents.thumbnail.is_none());
    assert!(contents.preprocessed_image.is_none());
  }

  #[test]
  fn synthetic_model_glb_pbr_payload() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_glb_pbr": {
        "url": "https://cdn.example.com/model_pbr.glb",
        "content_type": "model/gltf-binary",
        "file_name": "model_pbr.glb",
        "file_size": 7654321
      }
    }"#).unwrap();

    let glb_pbr = extract_model_glb_pbr(&obj).expect("should extract model_glb_pbr");
    assert_eq!(glb_pbr.url.as_deref(), Some("https://cdn.example.com/model_pbr.glb"));
    assert_eq!(glb_pbr.content_type.as_deref(), Some("model/gltf-binary"));
    assert_eq!(glb_pbr.file_name.as_deref(), Some("model_pbr.glb"));
    assert_eq!(glb_pbr.file_size, Some(7654321));
  }

  #[test]
  fn missing_model_glb_pbr_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_glb": {"url": "https://example.com/model.glb"}
    }"#).unwrap();

    assert!(extract_model_glb_pbr(&obj).is_none());
  }
}
