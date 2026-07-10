use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::PreprocessedImageData;

/// Extract and deserialize the `preprocessed_image` key from a webhook success payload.
pub(crate) fn extract_preprocessed_image(obj: &Map<String, Value>) -> Option<PreprocessedImageData> {
  let value = obj.get("preprocessed_image")?;
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
  fn preprocessed_image_from_triposplat_test_file() {
    let webhook = load_test_webhook("success/triposplat_splat_payload_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some");

    let image = contents.preprocessed_image.expect("preprocessed_image should be Some");
    assert_eq!(image.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1b77c/YyJ19g7lJsRNXmvZvahTE_61fc73dbe84446b08b1fcce2167b71d5.png"));
    assert_eq!(image.content_type.as_deref(), Some("image/png"));
    assert_eq!(image.file_name.as_deref(), Some("61fc73dbe84446b08b1fcce2167b71d5.png"));
    assert_eq!(image.file_size, Some(952754));
    assert_eq!(image.width, Some(1024));
    assert_eq!(image.height, Some(1024));

    // The splat itself arrives under `model_mesh`.
    let mesh = contents.model_mesh.expect("model_mesh should be Some");
    assert_eq!(mesh.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1b77c/hEzg5xn9A-1qrLsnywjN4_output.ply"));
    assert_eq!(mesh.content_type.as_deref(), Some("application/octet-stream"));
    assert_eq!(mesh.file_name.as_deref(), Some("output.ply"));
    assert_eq!(mesh.file_size, Some(17826208));
  }

  #[test]
  fn synthetic_preprocessed_image_payload() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "preprocessed_image": {
        "url": "https://cdn.example.com/segmented.png",
        "content_type": "image/png",
        "file_name": "segmented.png",
        "file_size": 12345,
        "width": 1024,
        "height": 1024
      }
    }"#).unwrap();

    let image = extract_preprocessed_image(&obj).expect("should extract preprocessed_image");
    assert_eq!(image.url.as_deref(), Some("https://cdn.example.com/segmented.png"));
    assert_eq!(image.content_type.as_deref(), Some("image/png"));
    assert_eq!(image.file_name.as_deref(), Some("segmented.png"));
    assert_eq!(image.file_size, Some(12345));
    assert_eq!(image.width, Some(1024));
    assert_eq!(image.height, Some(1024));
  }

  #[test]
  fn missing_preprocessed_image_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_mesh": {"url": "https://example.com/output.ply"}
    }"#).unwrap();

    assert!(extract_preprocessed_image(&obj).is_none());
  }
}
