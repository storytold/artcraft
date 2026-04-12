use serde_json::{Map, Value};

/// Extract the `video` key from a webhook success payload object.
/// Returns a clone of the value if the key exists.
pub fn extract_video(obj: &Map<String, Value>) -> Option<Value> {
  obj.get("video").cloned()
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
  fn video_payload_populates_video_field() {
    let webhook = load_test_webhook("success/video_payload_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    assert!(data.payload.get("video").is_some());

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some for a video payload");

    let video = contents.video.expect("video should be Some");

    // The video should be an object with url, content_type, file_name, file_size.
    assert_eq!(
      video.get("url").and_then(|v| v.as_str()),
      Some("https://v3b.fal.media/files/b/0abcdef0/AB-CDE_123456789abcde_output.mp4"),
    );
    assert_eq!(
      video.get("content_type").and_then(|v| v.as_str()),
      Some("video/mp4"),
    );
    assert_eq!(
      video.get("file_name").and_then(|v| v.as_str()),
      Some("output.mp4"),
    );
    assert_eq!(
      video.get("file_size").and_then(|v| v.as_u64()),
      Some(6226845),
    );

    // Other fields should be None.
    assert!(contents.image.is_none());
    assert!(contents.images.is_none());
    assert!(contents.model_glb.is_none());
    assert!(contents.model_mesh.is_none());
  }
}
