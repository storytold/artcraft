use serde::Deserialize;
use serde_json::Value;

#[derive(Debug, Clone, Deserialize)]
pub struct PollResponseThumbnailData {
  pub url: Option<String>,
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<u64>,
}

pub fn extract_thumbnail(value: &Value) -> Option<PollResponseThumbnailData> {
  let thumbnail = value.get("thumbnail")?;
  serde_json::from_value(thumbnail.clone()).ok()
}
