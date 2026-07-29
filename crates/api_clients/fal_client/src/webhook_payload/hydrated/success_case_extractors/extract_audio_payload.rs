use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::AudioData;

/// Extract and deserialize the `audio` key from a webhook success payload
/// (e.g. Seed Audio 1.0 speech results).
pub(crate) fn extract_audio(obj: &Map<String, Value>) -> Option<AudioData> {
  let value = obj.get("audio")?;
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
  fn audio_from_seed_audio_1p0_test_file() {
    let webhook = load_test_webhook("success/seed_audio_1p0_audio_payload_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some");

    let audio = contents.audio.expect("audio should be Some");
    assert_eq!(audio.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1bc36/vOSCcxsbibkZIiXR9BIZn_speech.mp3"));
    assert_eq!(audio.content_type.as_deref(), Some("audio/mpeg"));
    assert_eq!(audio.file_name.as_deref(), Some("speech.mp3"));
    assert_eq!(audio.file_size, Some(53612));
    assert_eq!(audio.duration, Some(6.63995));
    assert_eq!(audio.sample_rate, Some(24000));
    assert!(audio.bitrate.is_none());
    assert!(audio.channels.is_none());

    // No other content types in this payload.
    assert!(contents.image.is_none());
    assert!(contents.images.is_none());
    assert!(contents.video.is_none());
    assert!(contents.model_glb.is_none());
    assert!(contents.thumbnail.is_none());
  }

  #[test]
  fn synthetic_audio_payload() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "audio": {
        "url": "https://cdn.example.com/speech.mp3",
        "content_type": "audio/mpeg",
        "file_name": "speech.mp3",
        "file_size": 12345,
        "bitrate": 128000,
        "channels": 2,
        "duration": 3.5,
        "sample_rate": 44100
      }
    }"#).unwrap();

    let audio = extract_audio(&obj).expect("should extract audio");
    assert_eq!(audio.url.as_deref(), Some("https://cdn.example.com/speech.mp3"));
    assert_eq!(audio.content_type.as_deref(), Some("audio/mpeg"));
    assert_eq!(audio.file_name.as_deref(), Some("speech.mp3"));
    assert_eq!(audio.file_size, Some(12345));
    assert_eq!(audio.bitrate, Some(128000));
    assert_eq!(audio.channels, Some(2));
    assert_eq!(audio.duration, Some(3.5));
    assert_eq!(audio.sample_rate, Some(44100));
  }

  #[test]
  fn audio_url_only() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "audio": {"url": "https://cdn.example.com/speech.wav"}
    }"#).unwrap();

    let audio = extract_audio(&obj).expect("should extract audio");
    assert_eq!(audio.url.as_deref(), Some("https://cdn.example.com/speech.wav"));
    assert!(audio.content_type.is_none());
    assert!(audio.duration.is_none());
  }

  #[test]
  fn missing_audio_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "video": {"url": "https://example.com/video.mp4"}
    }"#).unwrap();

    assert!(extract_audio(&obj).is_none());
  }
}
