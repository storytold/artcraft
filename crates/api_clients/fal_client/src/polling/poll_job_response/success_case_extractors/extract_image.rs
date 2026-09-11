use serde::Deserialize;
use serde_json::Value;

#[derive(Debug, Clone, Deserialize)]
pub struct PollResponseSingleImageData {
  pub url: Option<String>,
  pub width: Option<u64>,
  pub height: Option<u64>,
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<u64>,
}

pub fn extract_image(value: &Value) -> Option<PollResponseSingleImageData> {
  let image = value.get("image")?;
  serde_json::from_value(image.clone()).ok()
}
