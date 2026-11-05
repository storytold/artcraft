/// Error type for Fal API interactions.
///
/// Originally from the vendored `fal` crate (`fal::FalError`).
/// Copied here so `fal_client` can be independent of the vendored crate.
#[derive(Debug, thiserror::Error)]
pub enum FalError {
  /// The HTTP call itself failed (connection, timeout, bad status after `error_for_status`).
  #[error("fal request failed: {0}")]
  RequestError(#[from] reqwest::Error),

  /// Converting to or from JSON failed.
  #[error("serialization error: {0}")]
  SerializeError(#[from] serde_json::Error),

  /// Anything else, usually the raw body text of a non-200 fal reply
  /// (`classify_fal_error` inspects this text).
  #[error("error: {0}")]
  Other(String),
}

// Lets `FalRequest` write `return Err(body_text.into())` for a non-200 reply.
impl From<String> for FalError {
  fn from(s: String) -> Self {
    FalError::Other(s)
  }
}
