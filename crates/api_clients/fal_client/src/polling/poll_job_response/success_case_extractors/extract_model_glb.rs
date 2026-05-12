use serde::Deserialize;
use serde_json::Value;

#[derive(Debug, Clone, Deserialize)]
pub struct PollResponseModelGlbData {
  pub url: Option<String>,
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<u64>,
}

pub fn extract_model_glb(value: &Value) -> Option<PollResponseModelGlbData> {
  let model_glb = value.get("model_glb")?;
  serde_json::from_value(model_glb.clone()).ok()
}
