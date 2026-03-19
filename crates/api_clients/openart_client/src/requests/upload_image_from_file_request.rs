
#[derive(Clone, Debug, Deserialize)]
struct RawUploadResponse {
  #[serde(rename = "imageUrl")]
  image_url: Option<String>,
  width: Option<i64>,
  height: Option<i64>,
}

use crate::creds::openart_credentials::OpenArtCredentials;
use crate::error::api_error::ApiError;
use crate::error::classify_http_error_response::classify_http_error_response;
use crate::error::client_error::ClientError;
use crate::error::openart_error::OpenArtError;
use log::info;
use reqwest::multipart::{Form, Part};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::time::Duration;
use tokio::fs::File;
use tokio::io::AsyncReadExt;

/// Try to prevent buffer reallocations.
/// There's a better way to implement this.
const INITIAL_BUFFER_SIZE : usize = 1024*1024;

const UPLOAD_URL: &str = "https://openart.ai/api/media/upload_raw_image";

pub async fn upload_image_from_file_request<P: AsRef<Path>>(
  file_path: P, 
  creds: &OpenArtCredentials,
  maybe_timeout: Option<Duration>,
) -> Result<(), OpenArtError> {
  
  let filename = file_path.as_ref().file_name()
      .ok_or_else(|| OpenArtError::Client(ClientError::Other("Could not determine filename from path".to_string())))?
      .to_string_lossy()
      .to_string();

  let mut file = File::open(&file_path)
      .await
      .map_err(|err| OpenArtError::Client(ClientError::IoError(err)))?;
  
  let mut file_bytes = Vec::with_capacity(INITIAL_BUFFER_SIZE);
  
  file.read_to_end(&mut file_bytes)
      .await
      .map_err(|err| OpenArtError::Client(ClientError::IoError(err)))?;

  // TODO: Read file magic bytes first, then fall back to this.
  let mime_type = match file_path.as_ref().extension().and_then(|e| e.to_str()) {
    Some("jpg") | Some("jpeg") => "image/jpeg",
    Some("png") => "image/png",
    // Some("webp") => "image/webp",
    // Some("gif") => "image/gif",
    // Some("mp4") => "video/mp4",
    // Some("mov") => "video/quicktime",
    // Some("webm") => "video/webm",
    _ => "application/octet-stream",
  };

  // Create multipart form
  let part = Part::bytes(file_bytes) // NB: Reqwest needs to own the bytes.
      .file_name(filename) // NB: Reqwest needs to own the bytes
      .mime_str(mime_type)
      .map_err(|err| OpenArtError::Client(ClientError::ReqwestError(err)))?;

  let form = Form::new().part("file", part);

  let cookie = creds.cookies.as_ref()
      .map(|cookies| cookies.to_string())
      .ok_or_else(|| OpenArtError::Client(ClientError::NoCookiesInCredentials))?;
  
  let session_id = creds.session_info.as_ref()
      .map(|info| info.sub.clone())
      .flatten()
      .ok_or_else(|| OpenArtError::Client(ClientError::NoSessionInfoInCredentials))?;

  // Make API request
  let client = Client::new();
  let mut request_builder = client.post(UPLOAD_URL)
      .multipart(form)
      .header("X-USER-ID", session_id)
      .header("Cookie", &cookie);

  if let Some(timeout) = maybe_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let response = request_builder
      .send()
      .await
      .map_err(|err| OpenArtError::Api(ApiError::ReqwestError(err)))?;

  // Check response status
  if !response.status().is_success() {
    info!("Error uploading image: {:?}", response.status());
    let error = classify_http_error_response(response).await;
    return Err(error);
  }

  // Parse response
  let upload_response = response.json::<RawUploadResponse>()
      .await
      .map_err(|err| OpenArtError::Api(ApiError::ReqwestError(err)))?;
  
  println!("Uploaded data: {:?}", upload_response);
  
  Ok(())
}

#[cfg(test)]
mod tests {
  use crate::creds::openart_cookies::OpenArtCookies;
  use crate::creds::openart_credentials::OpenArtCredentials;
  use crate::creds::openart_session_info::OpenArtSessionInfo;
  use crate::requests::get_session_request::get_session_request;
  use crate::requests::upload_image_from_file_request::upload_image_from_file_request;
  use errors::AnyhowResult;
  use test_utils::test_file_path::test_file_path;

  #[tokio::test]
  #[ignore] // Do not run in CI. Run manually to test session retrieval.
  async fn test() -> AnyhowResult<()> {
    let cookie = "";
    
    let mut creds = OpenArtCredentials {
      cookies: Some(OpenArtCookies::new(cookie.to_string())),
      session_info: None,
    };

    let session_details = get_session_request(&creds).await.unwrap();
    
    creds.session_info = Some(OpenArtSessionInfo {
      sub: session_details.sub.clone(),
      email: None,
      name: None,
      image: None,
    });
    
    let image_path = test_file_path("test_data/image/juno.jpg")?; // media_01jqyqgqpwf40tkcapq5bmaz5d
    
    let result = upload_image_from_file_request(image_path, &creds, None).await;
    
    assert!(result.is_ok());
    Ok(())
  }
}