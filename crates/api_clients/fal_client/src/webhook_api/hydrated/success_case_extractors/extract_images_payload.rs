use serde_json::{Map, Value};

/// Extract the `images` key from a webhook success payload object.
/// Returns a clone of the value if the key exists.
pub fn extract_images(obj: &Map<String, Value>) -> Option<Value> {
  obj.get("images").cloned()
}

#[cfg(test)]
mod tests {
  use crate::webhook_api::hydrate_webhook_contents::hydrate_webhook_contents;
  use crate::webhook_api::hydrated::hydrated_webhook_contents::HydratedWebhookContents;
  use crate::webhook_api::raw::raw_webhook_payload::RawWebhookPayload;

  fn load_test_webhook(filename: &str) -> RawWebhookPayload {
    let path = format!("test_data/webhooks/{}", filename);
    let json = std::fs::read_to_string(&path)
      .unwrap_or_else(|e| panic!("Failed to read {}: {}", path, e));
    serde_json::from_str(&json)
      .unwrap_or_else(|e| panic!("Failed to parse {}: {}", path, e))
  }

  #[test]
  fn images_payload_populates_images_field() {
    let webhook = load_test_webhook("success/images_payload_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    assert!(data.payload.get("images").is_some());

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some for an images payload");

    let images = contents.images.expect("images should be Some");
    let images_arr = images.as_array().expect("images should be an array");
    assert_eq!(images_arr.len(), 2);

    // First image.
    let first = &images_arr[0];
    assert_eq!(
      first.get("url").and_then(|v| v.as_str()),
      Some("https://v3b.fal.media/files/b/01234567/name1.png"),
    );
    assert_eq!(
      first.get("content_type").and_then(|v| v.as_str()),
      Some("image/png"),
    );

    // Second image.
    let second = &images_arr[1];
    assert_eq!(
      second.get("url").and_then(|v| v.as_str()),
      Some("https://v3b.fal.media/files/b/01234567/name2.png"),
    );

    // Other fields should be None.
    assert!(contents.image.is_none());
    assert!(contents.video.is_none());
    assert!(contents.model_glb.is_none());
    assert!(contents.model_mesh.is_none());
  }
}
