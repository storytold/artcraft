use serde::Deserialize;

#[derive(Deserialize)]
pub(crate) struct RawResponse {
  pub operation_id: String,
  pub done: Option<bool>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
  pub expires_at: Option<String>,
  pub error: Option<RawOperationError>,
  pub metadata: Option<serde_json::Value>,
  pub response: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct RawOperationError {
  pub code: Option<i32>,
  pub message: Option<String>,
}
