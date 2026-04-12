use serde_json::{Map, Value};

/// Extract the `video` key from a webhook success payload object.
/// Returns a clone of the value if the key exists.
pub fn extract_video(obj: &Map<String, Value>) -> Option<Value> {
  obj.get("video").cloned()
}
