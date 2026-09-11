use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::ImagesData;

/// Extract and deserialize the `images` key from a webhook success payload.
pub (crate) fn extract_images(obj: &Map<String, Value>) -> Option<Vec<ImagesData>> {
  let value = obj.get("images")?;
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
  fn images_payload_from_test_file() {
    let webhook = load_test_webhook("success/images_payload_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some");

    let images = contents.images.expect("images should be Some");
    assert_eq!(images.len(), 2);

    assert_eq!(images[0].url.as_deref(), Some("https://v3b.fal.media/files/b/01234567/name1.png"));
    assert_eq!(images[0].content_type.as_deref(), Some("image/png"));
    assert_eq!(images[0].file_name.as_deref(), Some("name1.png"));
    assert_eq!(images[0].file_size, Some(11500002));

    assert_eq!(images[1].url.as_deref(), Some("https://v3b.fal.media/files/b/01234567/name2.png"));
    assert_eq!(images[1].file_size, Some(13499999));

    assert!(contents.image.is_none());
    assert!(contents.video.is_none());
    assert!(contents.model_glb.is_none());
    assert!(contents.model_mesh.is_none());
  }

  #[test]
  fn synthetic_images_payload() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "images": [
        {"url": "https://example.com/a.png", "content_type": "image/png", "width": 1024, "height": 768},
        {"url": "https://example.com/b.jpg", "content_type": "image/jpeg", "file_size": 54321}
      ]
    }"#).unwrap();

    let images = extract_images(&obj).expect("should extract images");
    assert_eq!(images.len(), 2);

    assert_eq!(images[0].url.as_deref(), Some("https://example.com/a.png"));
    assert_eq!(images[0].width, Some(1024));
    assert_eq!(images[0].height, Some(768));
    assert!(images[0].file_size.is_none());

    assert_eq!(images[1].url.as_deref(), Some("https://example.com/b.jpg"));
    assert_eq!(images[1].content_type.as_deref(), Some("image/jpeg"));
    assert_eq!(images[1].file_size, Some(54321));
    assert!(images[1].width.is_none());
  }

  #[test]
  fn empty_images_array_returns_empty_vec() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "images": []
    }"#).unwrap();

    let images = extract_images(&obj).expect("should extract empty images");
    assert!(images.is_empty());
  }

  #[test]
  fn missing_images_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "video": {"url": "https://example.com/v.mp4"}
    }"#).unwrap();

    assert!(extract_images(&obj).is_none());
  }
}
