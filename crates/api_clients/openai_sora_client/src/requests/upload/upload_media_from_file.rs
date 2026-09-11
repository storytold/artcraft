use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::requests::upload::upload_media_http_request::upload_media_http_request;
use crate::requests::upload::upload_media_http_response::SoraMediaUploadResponse;
use log::error;
use std::path::Path;
use std::time::Duration;
use tokio::fs::File;
use tokio::io::AsyncReadExt;

/// Try to prevent buffer reallocations.
/// There's a better way to implement this.
const INITIAL_BUFFER_SIZE : usize = 1024*1024;

pub async fn sora_media_upload_from_file<P: AsRef<Path>>(
  file_path: P, 
  creds: &SoraCredentialSet,
  maybe_timeout: Option<Duration>,
) -> Result<SoraMediaUploadResponse, SoraError> {
  let mut file = File::open(&file_path).await
      .map_err(|err| {
        error!("Failed to open file for upload: {}", err);
        SoraClientError::FileForUploadReadError(err)
      })?;
  
  let mut buffer = Vec::with_capacity(INITIAL_BUFFER_SIZE);

  file.read_to_end(&mut buffer).await
      .map_err(|err| {
        error!("Failed to read file for upload: {}", err);
        SoraClientError::FileForUploadReadError(err)
      })?;

  let filename = file_path.as_ref().file_name()
    .ok_or_else(|| SoraClientError::FileForUploadHasInvalidPath)?
    .to_string_lossy()
    .to_string();
  
  let maybe_ext = file_path.as_ref().extension().and_then(|e| e.to_str());

  // TODO: Read file magic bytes first, then fall back to this.
  let mime_type = match maybe_ext {
    Some("jpg") | Some("jpeg") => "image/jpeg",
    Some("png") => "image/png",
    // Some("webp") => "image/webp",
    // Some("gif") => "image/gif",
    // Some("mp4") => "video/mp4",
    // Some("mov") => "video/quicktime",
    // Some("webm") => "video/webm",
    _ => "application/octet-stream",
  };

  Ok(upload_media_http_request(buffer, filename, mime_type, creds, maybe_timeout).await?)
}

#[cfg(test)]
mod tests {
  use crate::requests::upload::upload_media_from_file::sora_media_upload_from_file;
  use crate::test_utils::get_test_credentials::get_test_credentials;
  use errors::AnyhowResult;
  use test_utils::test_file_path::test_file_path;

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let creds = get_test_credentials()?;

    let image_path = test_file_path("test_data/image/juno.jpg")?; // media_01jqyqgqpwf40tkcapq5bmaz5d

    let response = sora_media_upload_from_file(
      image_path,
      &creds,
      None,
    ).await?;

    println!("media: {:?}", response);

    println!("media_id: {}", response.id);
    println!("media_url: {}", response.url);

    assert!(response.id.starts_with("media_"));

    Ok(())
  }
}
