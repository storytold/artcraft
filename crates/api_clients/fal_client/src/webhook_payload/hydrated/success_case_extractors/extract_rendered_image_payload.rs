use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::ThumbnailData;

/// Extract and deserialize the `rendered_image` key from a webhook success
/// payload (e.g. Tripo 3D's preview image). Same shape as `thumbnail`, and
/// used the same way: as a cover image for the model.
pub(crate) fn extract_rendered_image(obj: &Map<String, Value>) -> Option<ThumbnailData> {
  let value = obj.get("rendered_image")?;
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
  fn rendered_image_from_tripo3d_test_file() {
    let webhook = load_test_webhook("success/tripo3d_model_urls_rendered_image_payload_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some");

    let rendered_image = contents.rendered_image.expect("rendered_image should be Some");
    assert_eq!(rendered_image.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1bbd0/MblV2S5R6CeskRABMS7-V_preview.png"));
    assert_eq!(rendered_image.content_type.as_deref(), Some("image/png"));
    assert_eq!(rendered_image.file_name.as_deref(), Some("preview.png"));
    assert_eq!(rendered_image.file_size, Some(30970));

    // Tripo has no `thumbnail` key; the preview only arrives here.
    assert!(contents.thumbnail.is_none());
  }

  #[test]
  fn synthetic_rendered_image_payload() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "rendered_image": {
        "url": "https://cdn.example.com/preview.png",
        "content_type": "image/png",
        "file_name": "preview.png",
        "file_size": 12345
      }
    }"#).unwrap();

    let image = extract_rendered_image(&obj).expect("should extract rendered_image");
    assert_eq!(image.url.as_deref(), Some("https://cdn.example.com/preview.png"));
    assert_eq!(image.content_type.as_deref(), Some("image/png"));
    assert_eq!(image.file_name.as_deref(), Some("preview.png"));
    assert_eq!(image.file_size, Some(12345));
  }

  #[test]
  fn missing_rendered_image_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "thumbnail": {"url": "https://example.com/preview.png"}
    }"#).unwrap();

    assert!(extract_rendered_image(&obj).is_none());
  }
}
