use thiserror::Error;

#[derive(Debug, Error)]
pub enum DatadogError {
  #[error("HTTP transport error: {0}")]
  Transport(#[from] reqwest::Error),

  #[error("Datadog API returned non-2xx: status={status} body={body}")]
  Api { status: u16, body: String },

  #[error("Serialization error: {0}")]
  Serialization(#[from] serde_json::Error),
}
