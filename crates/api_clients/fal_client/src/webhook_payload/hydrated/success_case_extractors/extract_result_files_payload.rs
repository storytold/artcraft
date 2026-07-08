use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::ResultFileData;

/// Extract and deserialize the `result_files` key (a list of output files)
/// from a webhook success payload.
///
/// Returns `None` for a missing/unparseable key AND for an empty list — an
/// empty result set is not actionable, so callers can treat `Some` as
/// "there is at least one file".
pub (crate) fn extract_result_files(obj: &Map<String, Value>) -> Option<Vec<ResultFileData>> {
  let value = obj.get("result_files")?;
  let files: Vec<ResultFileData> = serde_json::from_value(value.clone()).ok()?;
  if files.is_empty() {
    return None;
  }
  Some(files)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn synthetic_result_files_payload() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "result_files": [
        {
          "url": "https://cdn.example.com/part_1.fbx",
          "content_type": "application/octet-stream",
          "file_name": "part_1.fbx",
          "file_size": 111111
        },
        {
          "url": "https://cdn.example.com/part_2.fbx",
          "content_type": "application/octet-stream",
          "file_name": "part_2.fbx",
          "file_size": 222222
        }
      ]
    }"#).unwrap();

    let files = extract_result_files(&obj).expect("should extract result_files");
    assert_eq!(files.len(), 2);
    assert_eq!(files[0].url.as_deref(), Some("https://cdn.example.com/part_1.fbx"));
    assert_eq!(files[0].file_size, Some(111111));
    assert_eq!(files[1].url.as_deref(), Some("https://cdn.example.com/part_2.fbx"));
    assert_eq!(files[1].file_name.as_deref(), Some("part_2.fbx"));
  }

  #[test]
  fn empty_result_files_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "result_files": []
    }"#).unwrap();

    assert!(extract_result_files(&obj).is_none());
  }

  #[test]
  fn missing_result_files_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_glb": {"url": "https://example.com/mesh.glb"}
    }"#).unwrap();

    assert!(extract_result_files(&obj).is_none());
  }
}
