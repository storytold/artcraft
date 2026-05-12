use serde::Deserialize;
use serde_json::Value;

#[derive(Debug, Clone, Deserialize)]
pub struct PollResponseImageEntry {
  pub url: Option<String>,
  pub width: Option<u64>,
  pub height: Option<u64>,
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<u64>,
}

pub fn extract_images(value: &Value) -> Option<Vec<PollResponseImageEntry>> {
  let arr = value.get("images")?.as_array()?;
  let images: Vec<PollResponseImageEntry> = arr.iter()
    .filter_map(|v| serde_json::from_value(v.clone()).ok())
    .collect();
  if images.is_empty() { None } else { Some(images) }
}
