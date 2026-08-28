#[derive(Debug, thiserror::Error)]
pub enum WebBase64Error {
  #[error("data URL is not base64-encoded (missing `;base64,` marker)")]
  NotBase64Encoded,
  #[error("malformed data URL: no comma separator found")]
  MalformedDataUrl,
  #[error("base64 decode error: {0}")]
  DecodeError(#[from] base64::DecodeError),
}
