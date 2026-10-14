use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_error::SoraError;
use crate::requests::upload::upload_media_http_request::upload_media_http_request;
use crate::requests::upload::upload_media_http_response::SoraMediaUploadResponse;
use std::path::Path;
use std::time::Duration;

/// Upload bytes, inferring the MIME type from the filename for legacy callers.
/// The underlying reqwest lib needs to own the bytes, so we can't pass as a reference.
pub async fn sora_media_upload_from_bytes(
  bytes: Vec<u8>,
  file_name: String,
  creds: &SoraCredentialSet,
  maybe_timeout: Option<Duration>,
) -> Result<SoraMediaUploadResponse, SoraError> {
  sora_media_upload_from_bytes_inner(bytes, file_name, None, creds, maybe_timeout).await
}

/// Upload bytes using the caller-provided MIME type instead of guessing from the filename.
pub async fn sora_media_upload_from_bytes_with_mime_type(
  bytes: Vec<u8>,
  file_name: String,
  mime_type: &str,
  creds: &SoraCredentialSet,
  maybe_timeout: Option<Duration>,
) -> Result<SoraMediaUploadResponse, SoraError> {
  sora_media_upload_from_bytes_inner(bytes, file_name, Some(mime_type), creds, maybe_timeout).await
}

async fn sora_media_upload_from_bytes_inner(
  bytes: Vec<u8>,
  file_name: String,
  explicit_mime_type: Option<&str>,
  creds: &SoraCredentialSet,
  maybe_timeout: Option<Duration>,
) -> Result<SoraMediaUploadResponse, SoraError> {
  let mime_type = resolved_mime_type(&file_name, explicit_mime_type);
  upload_media_http_request(bytes, file_name, &mime_type, creds, maybe_timeout).await
}

fn resolved_mime_type(file_name: &str, explicit_mime_type: Option<&str>) -> String {
  explicit_mime_type.map(str::to_owned).unwrap_or_else(|| inferred_mime_type(file_name).to_owned())
}

fn inferred_mime_type(file_name: &str) -> &'static str {
  // TODO: Read file magic bytes first, then fall back to this.
  match Path::new(file_name).extension().and_then(|e| e.to_str()) {
    Some("jpg") | Some("jpeg") => "image/jpeg",
    Some("png") => "image/png",
    // Some("webp") => "image/webp",
    // Some("gif") => "image/gif",
    // Some("mp4") => "video/mp4",
    // Some("mov") => "video/quicktime",
    // Some("webm") => "video/webm",
    _ => "application/octet-stream",
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn explicit_mime_type_overrides_filename_guessing() {
    assert_eq!(resolved_mime_type("extensionless", Some("image/webp")), "image/webp");
    assert_eq!(resolved_mime_type("looks-like.jpeg", Some("image/png")), "image/png");
  }

  #[test]
  fn legacy_filename_inference_is_preserved() {
    assert_eq!(resolved_mime_type("image.jpeg", None), "image/jpeg");
    assert_eq!(resolved_mime_type("image.png", None), "image/png");
    assert_eq!(resolved_mime_type("extensionless", None), "application/octet-stream");
  }
}
