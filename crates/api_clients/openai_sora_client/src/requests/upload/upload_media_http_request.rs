use crate::constants::user_agent::CLIENT_USER_AGENT;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::requests::upload::upload_media_http_response::SoraMediaUploadResponse;
use crate::utils_internal::classify_general_http_error::classify_general_http_error;
use log::{error, info};
use serde::Deserialize;
use std::io::empty;
use std::time::Duration;
use wreq::header::{ACCEPT, ACCEPT_LANGUAGE, AUTHORIZATION, COOKIE, ORIGIN, REFERER};
use wreq::multipart::{Form, Part};
use wreq::Client;

const SORA_UPLOAD_MEDIA_URL: &str = "https://sora.com/backend/uploads";

pub (crate) struct SoraMediaUploadRequest<'a> {
  pub file_path: String,
  pub credentials: &'a SoraCredentialSet,
}

pub (crate) async fn upload_media_http_request(
  file_bytes: Vec<u8>,
  filename: String,
  mime_type: &str,
  credentials: &SoraCredentialSet,
  maybe_timeout: Option<Duration>,
) -> Result<SoraMediaUploadResponse, SoraError> {

  // Create multipart form
  let part = Part::bytes(file_bytes) // NB: Reqwest needs to own the bytes. 
      .file_name(filename) // NB: Reqwest needs to own the bytes
      .mime_str(mime_type)
      .map_err(|e| SoraClientError::MultipartFormError(e))?;

  let form = Form::new().part("file", part);

  let cookie = credentials.cookies.to_string();
  let auth_header = credentials.jwt_bearer_token
      .as_ref()
      .ok_or(SoraClientError::NoBearerTokenForRequest)?
      .to_authorization_header_value();

  // Make API request
  let client = Client::new();
  let mut request_builder = client.post(SORA_UPLOAD_MEDIA_URL)
      .multipart(form)
      .header(ACCEPT, "*/*")
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.9")
      .header(AUTHORIZATION, &auth_header)
      .header(COOKIE, &cookie)
      .header(ORIGIN, "https://sora.chatgpt.com")
      .header("user-agent", CLIENT_USER_AGENT)
      .header(REFERER, "https://sora.chatgpt.com/explore")
      .header("priority", "u=1, i")
      .header("sec-ch-ua", "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"")
      .header("sec-ch-ua-mobile", "?0")
      .header("sec-ch-ua-platform", "macOS")
      .header("sec-fetch-dest", "empty")
      .header("sec-fetch-mode", "cors")
      .header("sec-fetch-site", "same-origin");

  if let Some(timeout) = maybe_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let response = request_builder.send()
      .await
      .map_err(|err| {
        SoraGenericApiError::WreqError(err)
      })?;

  // Check response status
  if !response.status().is_success() {
    info!("Error uploading image: {:?}", response.status());
    let error = classify_general_http_error(response).await;
    return Err(error);
  }

  let response_body = &response.text().await
      .map_err(|err| {
        error!("Error reading response body while attempting file upload: {:?}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  let upload_response : SoraMediaUploadResponse = serde_json::from_str(&response_body)
      .map_err(|err| {
        error!("Error parsing response body while attempting file upload: {:?}", err);
        SoraGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string())
      })?;

  Ok(upload_response)
}
