use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::api_error::ApiError;
use crate::error::client_error::ClientError;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::constants::{APPLICATION_JSON, USER_AGENT};
use crate::utils::filter_bad_response::filter_bad_response;
use crate::utils::http_get_anonymous::http_get_anonymous;
use chrono::{DateTime, Utc};
use uuid_utils::uuid::generate_random_uuid;
use log::debug;
use reqwest::multipart::{Form, Part};
use reqwest::Client;
use serde_derive::{Deserialize, Serialize};
use std::fs::File;
use std::io::Read;
use std::path::Path;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use uuid::uuid;

pub struct UploadImageBytesArgs<'a> {
  pub api_host: &'a ApiHost,
  pub maybe_creds: Option<&'a StorytellerCredentialSet>,
  
  // NB: Bytes need to be owned for the request.
  pub image_bytes: Vec<u8>,
  pub image_type: ImageType,
  
  /// If true, we should hide the image from the user's gallery.
  pub is_intermediate_system_file: bool,
}

#[derive(Clone, Copy, Debug)]
pub enum ImageType {
  Png,
  Jpeg,
  Gif,
}

impl ImageType {
  pub fn mime_type(&self) -> &str {
    match self {
      ImageType::Png => "image/png",
      ImageType::Jpeg => "image/jpeg",
      ImageType::Gif => "image/gif",
    }
  }
  pub fn file_extension(&self) -> &str {
    match self {
      ImageType::Png => "png",
      ImageType::Jpeg => "jpg",
      ImageType::Gif => "gif",
    }
  }
}

/// Upload an image media file from a file.
/// NB: File type is not checked, so caller needs to enforce.
/// NB: We need owned bytes for the request.
pub async fn upload_image_media_file_from_bytes(
  args: UploadImageBytesArgs<'_>
) -> Result<UploadImageMediaFileSuccessResponse, StorytellerError> {

  let url = get_route(args.api_host);

  debug!("Requesting {:?}", &url);

  let client = Client::builder()
      .gzip(true)
      .build()
      .map_err(|err| StorytellerError::Client(ClientError::from(err)))?;

  let part = Part::bytes(args.image_bytes)
      .file_name(format!("image.{}", args.image_type.file_extension()))
      .mime_str(args.image_type.mime_type())
      .map_err(|err| StorytellerError::Client(ClientError::from(err)))?;

  let mut form = Form::new()
      .text("uuid_idempotency_token", generate_random_uuid())
      .part("file", part);
  
  if args.is_intermediate_system_file {
    form = form.text("is_intermediate_system_file", "true");
  }

  let mut request_builder = client.post(url)
      .header("User-Agent", USER_AGENT)
      .header("Accept", APPLICATION_JSON);
  
  if let Some(creds) = args.maybe_creds {
    if let Some(header) = &creds.maybe_as_cookie_header() {
      request_builder = request_builder.header("Cookie", header);
    }
  }
  
  let response = request_builder
      .multipart(form)
      .send()
      .await
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  let response = filter_bad_response(response).await?;
  let response_body = &response.text().await
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  let media_file = serde_json::from_str(&response_body)
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  Ok(media_file)
}

fn get_route(api_host: &ApiHost) -> String {
  let api_hostname_and_scheme = api_host.to_api_hostname_and_scheme();
  format!("{}/v1/media_files/upload/image", api_hostname_and_scheme)
}

// TODO(bt,2025-04-22): Share API definitions between client and server in common crate.

#[derive(Deserialize, Debug)]
pub struct UploadImageMediaFileSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}
