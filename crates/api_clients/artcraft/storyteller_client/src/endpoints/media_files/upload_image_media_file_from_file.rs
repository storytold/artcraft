use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::api_error::ApiError;
use crate::error::client_error::ClientError;
use crate::error::storyteller_error::StorytellerError;
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
use enums::common::generation_provider::GenerationProvider;
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

pub struct UploadImageFromFileArgs<'a, P: AsRef<Path>> {
  pub api_host: &'a ApiHost,
  pub maybe_creds: Option<&'a StorytellerCredentialSet>,
  
  // NB: Path needs to be owned for the request.
  pub path: P,

  /// If true, we should hide the image from the user's gallery.
  pub is_intermediate_system_file: bool,

  /// If provided, this is the prompt that this image is associated with.
  /// NOTE: Cannot set `is_intermediate_system_file = true` if this is set.
  pub maybe_prompt_token: Option<&'a PromptToken>,

  // /// If provided, this is the service provider that created the image.
  // /// NOTE: Cannot set `is_intermediate_system_file = true` if this is set.
  // pub maybe_generation_provider: Option<GenerationProvider>,
  
  /// If provided, this groups the file into a batch
  /// TODO: This shouldn't be set clientside without the backend generating the token 
  ///  and cryptographically securing it. But we need to go fast here.
  pub maybe_batch_token: Option<&'a BatchGenerationToken>,
}


/// Upload an image media file from a file.
pub async fn upload_image_media_file_from_file<P: AsRef<Path>>(
  args: UploadImageFromFileArgs<'_, P>,
) -> Result<UploadImageMediaFileSuccessResponse, StorytellerError> {
  
  validate_args(&args)?;

  let url = get_route(args.api_host);

  debug!("Requesting {:?}", &url);

  //let mut file = File::open(path)?;

  let client = Client::builder()
      .gzip(true)
      .build()
      .map_err(|err| StorytellerError::Client(ClientError::from(err)))?;

  let file_bytes = std::fs::read(args.path.as_ref())
      .map_err(|err| StorytellerError::Client(ClientError::from(err)))?;
  let file_name = args.path.as_ref().file_name()
      .and_then(|n| n.to_str()).unwrap_or("file").to_string();
  let mut form = Form::new()
      .text("uuid_idempotency_token", generate_random_uuid())
      .part("file", Part::bytes(file_bytes).file_name(file_name));

  if args.is_intermediate_system_file {
    form = form.text("is_intermediate_system_file", "true");
  }
  
  if let Some(prompt_token) = &args.maybe_prompt_token {
    form = form.text("maybe_prompt_token", prompt_token.to_string());
  }
  
  if let Some(batch_token) = &args.maybe_batch_token {
    form = form.text("maybe_batch_token", batch_token.to_string());
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

fn validate_args<P: AsRef<Path>>(
  args: &UploadImageFromFileArgs<'_, P>,
) -> Result<(), StorytellerError> {
  if args.is_intermediate_system_file && args.maybe_prompt_token.is_some() {
    return Err(StorytellerError::Client(ClientError::InvalidPreflightRequest(
      "Cannot set `is_intermediate_system_file` to true if `maybe_prompt_token` is provided."
          .to_string())));
  }

  Ok(())
}
