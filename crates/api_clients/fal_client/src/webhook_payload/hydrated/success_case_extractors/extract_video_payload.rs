use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::VideoData;

/// Extract and deserialize the `video` key from a webhook success payload.
pub (crate) fn extract_video(obj: &Map<String, Value>) -> Option<VideoData> {
  let value = obj.get("video")?;
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
  fn video_payload_from_test_file() {
    let webhook = load_test_webhook("success/video_payload_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some");

    let video = contents.video.expect("video should be Some");

    assert_eq!(video.url.as_deref(), Some("https://v3b.fal.media/files/b/0abcdef0/AB-CDE_123456789abcde_output.mp4"));
    assert_eq!(video.content_type.as_deref(), Some("video/mp4"));
    assert_eq!(video.file_name.as_deref(), Some("output.mp4"));
    assert_eq!(video.file_size, Some(6226845));

    assert!(contents.image.is_none());
    assert!(contents.images.is_none());
    assert!(contents.model_glb.is_none());
    assert!(contents.model_mesh.is_none());
  }

  #[test]
  fn synthetic_video_payload() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "video": {
        "url": "https://cdn.example.com/output.mp4",
        "content_type": "video/mp4",
        "file_name": "clip.mp4",
        "file_size": 12345678
      }
    }"#).unwrap();

    let video = extract_video(&obj).expect("should extract video");
    assert_eq!(video.url.as_deref(), Some("https://cdn.example.com/output.mp4"));
    assert_eq!(video.content_type.as_deref(), Some("video/mp4"));
    assert_eq!(video.file_name.as_deref(), Some("clip.mp4"));
    assert_eq!(video.file_size, Some(12345678));
  }

  #[test]
  fn synthetic_video_url_only() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "video": {"url": "https://cdn.example.com/v.mp4"}
    }"#).unwrap();

    let video = extract_video(&obj).expect("should extract video");
    assert_eq!(video.url.as_deref(), Some("https://cdn.example.com/v.mp4"));
    assert!(video.content_type.is_none());
    assert!(video.file_name.is_none());
    assert!(video.file_size.is_none());
  }

  #[test]
  fn missing_video_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "images": [{"url": "https://example.com/img.png"}]
    }"#).unwrap();

    assert!(extract_video(&obj).is_none());
  }
}
