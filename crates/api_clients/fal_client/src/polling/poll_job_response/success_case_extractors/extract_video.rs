use serde::Deserialize;
use serde_json::Value;

#[derive(Debug, Clone, Deserialize)]
pub struct PollResponseVideoData {
  pub url: Option<String>,
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<u64>,
}

pub fn extract_video(value: &Value) -> Option<PollResponseVideoData> {
  let video = value.get("video")?;
  serde_json::from_value(video.clone()).ok()
}
