use crate::constants::user_agent::USER_AGENT;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::utils_internal::classify_general_http_error::classify_general_http_error;
use log::{error, info};
use serde::Deserialize;
use std::io::empty;
use std::time::Duration;
use wreq::multipart::{Form, Part};
use wreq::Client;
use crate::requests::list_sora2_drafts::list_sora2_drafts::Draft;

const SORA_UPLOAD_MEDIA_URL: &str = "https://sora.chatgpt.com/backend/uploads";



pub (crate) struct SoraMediaUploadArgs<'a> {
  pub credentials: &'a SoraCredentialSet,
  pub file_bytes: Vec<u8>, // NB: Reqwest needs to own the bytes, so we can't pass as a reference.
  pub filename: String, // NB: Reqwest needs to own the bytes, so we can't pass as a reference.
  pub mime_type: &'a str,
  pub maybe_timeout: Option<Duration>,
}

#[derive(Clone, Debug)]
pub struct SoraMediaUploadResult {
  pub drafts: Vec<Draft>,
}

pub (crate) async fn upload_media_sora2_http_request(
  args: SoraMediaUploadArgs<'_>
) -> Result<SoraMediaUploadResult, SoraError> {

  // Create multipart form
  let part = Part::bytes(args.file_bytes) // NB: Reqwest needs to own the bytes. 
      .file_name(args.filename) // NB: Reqwest needs to own the bytes
      .mime_str(args.mime_type)
      .map_err(|e| SoraClientError::MultipartFormError(e))?;

  let form = Form::new().part("file", part);

  let cookie = args.credentials.cookies.to_string();
  let auth_header = args.credentials.jwt_bearer_token
      .as_ref()
      .ok_or(SoraClientError::NoBearerTokenForRequest)?
      .to_authorization_header_value();

  // Make API request
  let client = Client::new();
  let mut request_builder = client.post(SORA_UPLOAD_MEDIA_URL)
      .multipart(form)
      .header("User-Agent", USER_AGENT)
      .header("Cookie", &cookie)
      .header("Authorization", &auth_header);
  
  if let Some(timeout) = args.maybe_timeout {
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
