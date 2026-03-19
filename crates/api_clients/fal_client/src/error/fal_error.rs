/// Error type for Fal API interactions.
///
/// Originally from the vendored `fal` crate (`fal::FalError`).
/// Copied here so `fal_client` can be independent of the vendored crate.
#[derive(Debug, thiserror::Error)]
pub enum FalError {
  #[error("fal request failed: {0}")]
  RequestError(#[from] reqwest::Error),

  #[error("serialization error: {0}")]
  SerializeError(#[from] serde_json::Error),

  #[error("error: {0}")]
  Other(String),
}

impl From<String> for FalError {
  fn from(s: String) -> Self {
    FalError::Other(s)
  }
}
