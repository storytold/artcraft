use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::api_error::ApiError;
use crate::utils::api_host::ApiHost;
use crate::utils::constants::{APPLICATION_JSON, USER_AGENT};
use crate::utils::filter_bad_response::filter_bad_response;
use crate::utils::http_get_anonymous::http_get_anonymous;
use chrono::{DateTime, Utc};
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;
use idempotency::uuid::generate_random_uuid;
use log::debug;
use reqwest::multipart::{Form, Part};
use reqwest::Client;
use serde_derive::{Deserialize, Serialize};
use std::path::Path;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use uuid::uuid;

// TODO: The naming of these methods is ridiculous. It needs to be cleaned up.

/// Upload an image media file from a file.
pub async fn upload_new_engine_asset_from_file<P: AsRef<Path>>(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  path: P,
) -> Result<UploadImageMediaFileSuccessResponse, ApiError> {

  let url = get_route(api_host);

  debug!("Requesting {:?}", &url);

  let client = Client::builder()
      .gzip(true)
      .build()?;

  let file_bytes = std::fs::read(path.as_ref())?;
  let file_name = path.as_ref().file_name()
      .and_then(|n| n.to_str()).unwrap_or("file").to_string();
  let form = Form::new()
      .text("uuid_idempotency_token", generate_random_uuid())
      .text("engine_category", "object") // TODO: Which type should we use?
      .part("file", Part::bytes(file_bytes).file_name(file_name));

  let mut request_builder = client.post(url)
      .header("User-Agent", USER_AGENT)
      .header("Accept", APPLICATION_JSON);
  
  if let Some(creds) = maybe_creds {
    if let Some(header) = &creds.maybe_as_cookie_header() {
      request_builder = request_builder.header("Cookie", header);
    }
  }
  
  let response = request_builder
      .multipart(form)
      .send()
      .await?;

  let response = filter_bad_response(response).await?;
  let response_body = &response.text().await?;

  let media_file = serde_json::from_str(&response_body)?;

  Ok(media_file)
}

fn get_route(api_host: &ApiHost) -> String {
  let api_hostname_and_scheme = api_host.to_api_hostname_and_scheme();
  format!("{}/v1/media_files/upload/new_engine_asset", api_hostname_and_scheme)
}

// TODO(bt,2025-04-22): Share API definitions between client and server in common crate.

#[derive(Deserialize, Debug)]
pub struct UploadImageMediaFileSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}
