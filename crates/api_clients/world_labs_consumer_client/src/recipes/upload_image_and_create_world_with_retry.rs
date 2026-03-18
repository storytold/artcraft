use crate::api::api_types::image_input_object_id::ImageInputObjectId;
use crate::api::api_types::meta_world_object_id::MetaWorldObjectId;
use crate::api::api_types::pano_object_id::PanoObjectId;
use crate::api::api_types::run_object_id::RunObjectId;
use crate::api::api_types::upload_mime_type::UploadMimeType;
use crate::api::api_types::world_id::WorldObjectId;
use crate::api::requests::google_refresh_token::google_refresh_token::{google_refresh_token, GoogleRefreshTokenArgs};
use crate::api::requests::google_upload::google_upload_image::{google_upload_image, GoogleUploadImageArgs};
use crate::api::requests::objects::begin_object_image_upload::{begin_object_image_upload, BeginObjectImageUploadArgs};
use crate::api::requests::objects::create_run_object::{create_run_object, CreateRunObjectArgs};
use crate::api::requests::objects::create_upload_object::{create_upload_object, CreateUploadObjectArgs};
use crate::api::requests::objects::finalize_object_image_upload::{finalize_object_image_upload, FinalizeObjectImageUploadArgs};
use crate::api::requests::objects::update_run_object_with_upload::{update_run_object_with_upload, UpdateRunObjectWithUploadArgs, UpdateRunObjectWithUploadPayloadArgs};
use crate::api::requests::objects::update_run_object_with_world::{update_run_object_with_world, UpdateRunObjectWithWorldArgs, UpdateRunObjectWithWorldPayloadArgs};
use crate::api::requests::recaption::recaption_image::{recaption_image, RecaptionImageArgs};
use crate::api::requests::worlds::create_world::{create_world, CreateWorldArgs};
use crate::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use crate::credentials::world_labs_cookies::WorldLabsCookies;
use crate::credentials::worldlabs_refresh_token::WorldLabsRefreshToken;
use crate::error::world_labs_client_error::WorldLabsClientError;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use anyhow::bail;
use chrono::{TimeDelta, Utc};
use filesys::file_read_bytes::file_read_bytes;
use log::{error, info, warn};
use serde::Deserialize;
use std::path::PathBuf;
use std::time::Duration;
use uuid::Uuid;

pub struct UploadImageAndCreateWorldWithRetryArgs<'a> {
  pub file: FileBytesOrPath,
  pub cookies: &'a WorldLabsCookies,
  pub bearer_token: &'a WorldLabsBearerToken,
  pub refresh_token: &'a WorldLabsRefreshToken,
  pub individual_request_timeout: Option<Duration>,
}

pub enum FileBytesOrPath {
  Bytes(Vec<u8>),
  Path(PathBuf),
}

pub struct UploadImageAndCreateWorldWithRetryResponse {
  pub run_id: RunObjectId,
  pub world_id: WorldObjectId,
  pub image_upload_url: String,

  /// If the tokens were renewed, this is them.
  pub maybe_new_access_tokens: Option<NewAccessTokens>,
}

pub struct NewAccessTokens {
  pub bearer_token: WorldLabsBearerToken,
  pub refresh_token: WorldLabsRefreshToken,
}

/// Marble Image-to-World
/// Mark the upload as complete.
/// Request #5 (of ~10)
pub async fn upload_image_and_create_world_with_retry(args: UploadImageAndCreateWorldWithRetryArgs<'_>) -> Result<UploadImageAndCreateWorldWithRetryResponse, WorldLabsError> {

  info!("Checking to see if bearer token needs refresh (fails open) ...");

  let mut maybe_refresh_bearer = false;

  match args.bearer_token.parse_jwt_claims() {
    Err(err) => {
      warn!("Failed to parse bearer_token jwt claims (failing open) : {}", err);
    }
    Ok(jwt) => {
      let now = Utc::now();
      if now > jwt.expiration {
        info!("Bearer is expired.");
        maybe_refresh_bearer = true;
      }

      let sooner_expiry = jwt.expiration
          .checked_sub_signed(TimeDelta::minutes(30))
          .unwrap_or(jwt.expiration);

      if now > sooner_expiry {
        info!("Bearer will expire soon, so we're renewing it in advance.");
        maybe_refresh_bearer = true;
      }
    }
  };

  let mut maybe_new_access_tokens = None;

  if maybe_refresh_bearer {
    info!("Refreshing bearer token...");

    let updated = google_refresh_token(GoogleRefreshTokenArgs {
      refresh_token: &args.refresh_token,
      request_timeout: args.individual_request_timeout,
    }).await?;

    info!("Bearer token refreshed!");

    maybe_new_access_tokens = Some(NewAccessTokens {
      bearer_token: updated.bearer_token,
      refresh_token: updated.refresh_token,
    });
  }

  let use_bearer_token = maybe_new_access_tokens
      .as_ref()
      .map(|tokens| &tokens.bearer_token)
      .unwrap_or_else(|| args.bearer_token);

  info!("Checking file input...");
  
  let file_bytes = match args.file {
    FileBytesOrPath::Bytes(bytes) => {
      info!("File bytes provided");
      bytes
    }
    FileBytesOrPath::Path(path) => {
      info!("File path provided");
      match file_read_bytes(&path) {
        Ok(bytes) => bytes,
        Err(err) => {
          error!("Error reading file bytes from path: {:?} - error: {:?}", path, err);
          return Err(WorldLabsClientError::CannotReadLocalFileForUpload(err).into());
        }
      }
    }
  };

  info!("Request #1 of 10: create run object ...");

  let response = create_run_object(CreateRunObjectArgs {
    cookies: args.cookies,
    bearer_token: use_bearer_token,
    request_timeout: args.individual_request_timeout,
  }).await?;

  let run_object_id = response.id;
  let run_object = response.run_object;

  info!("Object id: {}", run_object_id.0);

  // TODO - multiple types.
  let upload_mime_type= UploadMimeType::ImageJpeg;

  info!("Request #2 of 10: begin image attachment ...");

  let response = create_upload_object(CreateUploadObjectArgs {
    cookies: &args.cookies,
    bearer_token: &use_bearer_token,
    upload_mime_type,
    request_timeout: args.individual_request_timeout,
  }).await?;

  let upload_id = response.id;

  info!("Upload id: {}", upload_id.0);

  info!("Request #3 of 10: begin image upload ...");

  let response = begin_object_image_upload(BeginObjectImageUploadArgs {
    cookies: &args.cookies,
    bearer_token: &use_bearer_token,
    upload_mime_type,
    request_timeout: args.individual_request_timeout,
    upload_id: &upload_id,
  }).await?;

  let google_upload_url = response.upload_url;

  info!("Request #4 of 10: upload to Google GCP ...");

  info!("Google upload URL: {:?}", &google_upload_url);

  let _response = google_upload_image(GoogleUploadImageArgs {
    upload_url: &google_upload_url,
    upload_mime_type,
    file_bytes,
    request_timeout: args.individual_request_timeout,
  }).await?;

  info!("Request #5 of 10: finalize object upload ...");

  let response = finalize_object_image_upload(FinalizeObjectImageUploadArgs {
    cookies: &args.cookies,
    bearer_token: &use_bearer_token,
    upload_id: &upload_id,
    request_timeout: args.individual_request_timeout,
  }).await?;

  let image_url = response.object_url;

  info!("Object/image URL: {image_url}");

  info!("Request #6 of 10: Patch run with new info (first time) ...");

  let image_input_id = ImageInputObjectId::generate_new();
  let pano_id = PanoObjectId::generate_new();
  let meta_world_id = MetaWorldObjectId::generate_new();

  let response = update_run_object_with_upload(UpdateRunObjectWithUploadArgs {
    cookies: &args.cookies,
    bearer_token: &use_bearer_token,
    payload_args: UpdateRunObjectWithUploadPayloadArgs {
      run_id: &run_object_id,
      run_created_at_timestamp: run_object.metadata.created_at,
      image_upload_url: &image_url,
      image_input_id: &image_input_id,
      pano_id: &pano_id,
      meta_world_id: &meta_world_id,
    },
    request_timeout: args.individual_request_timeout,
  }).await?;

  let run_first_updated_at = response.run_updated_timestamp;

  info!("Request #7 of 10: captioning with VLM ...");

  let response = recaption_image(RecaptionImageArgs {
    cookies: &args.cookies,
    bearer_token: &use_bearer_token,
    upload_id: &upload_id,
    upload_mime_type,
    run_id: &run_object_id,
    request_timeout: args.individual_request_timeout,
  }).await?;

  info!("Title: {}", response.title);
  info!("Caption: {}", response.caption);

  let title = response.title;
  let text_prompt = response.caption;

  info!("Request #8 of 10: create world ...");

  let response = create_world(CreateWorldArgs {
    cookies: &args.cookies,
    bearer_token: &use_bearer_token,
    text_prompt: &text_prompt,
    image_upload_url: &image_url,
    request_timeout: args.individual_request_timeout,
  }).await?;

  let world_id = response.world_id;

  info!("World ID: {}", &world_id.0);

  info!("Request #9 of 10: patch run with new info (second time) ...");

  let response = update_run_object_with_world(UpdateRunObjectWithWorldArgs {
    cookies: &args.cookies,
    bearer_token: &use_bearer_token,
    payload_args: UpdateRunObjectWithWorldPayloadArgs {
      run_id: &run_object_id,
      run_created_at_timestamp: run_object.metadata.created_at,
      first_patch_timestamp: run_first_updated_at,
      image_upload_url: &image_url,
      image_input_id: &image_input_id,
      pano_id: &pano_id,
      meta_world_id: &meta_world_id,
      world_id: &world_id,
      title: &title,
      text_prompt: &text_prompt,
    },
    request_timeout: args.individual_request_timeout,
  }).await?;

  Ok(UploadImageAndCreateWorldWithRetryResponse {
    run_id: run_object_id,
    image_upload_url: image_url,
    world_id,
    maybe_new_access_tokens,
  })
}

#[cfg(test)]
mod tests {
  use crate::recipes::upload_image_and_create_world_with_retry::{upload_image_and_create_world_with_retry, FileBytesOrPath, UploadImageAndCreateWorldWithRetryArgs};
  use crate::test_utils::get_test_bearer_token::get_test_bearer_token;
  use crate::test_utils::get_test_cookies::get_typed_test_cookies;
  use crate::test_utils::get_test_refresh_token::get_typed_test_refresh_token;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use filesys::file_read_bytes::file_read_bytes;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore] // Client side tests only
  async fn test_requests() {
    setup_test_logging(LevelFilter::Debug);

    let cookies = get_typed_test_cookies().unwrap();
    let bearer_token = get_test_bearer_token().unwrap();
    let refresh_token = get_typed_test_refresh_token().unwrap();

    //let file_path = "/home/bt/Pictures/locations/island.jpg";
    let file_path = "/Users/bt/Pictures/Midjourney/jeep.jpeg";
    let file_bytes = file_read_bytes(file_path).unwrap();

    println!("File bytes len: {}", file_bytes.len());

    let results = upload_image_and_create_world_with_retry(UploadImageAndCreateWorldWithRetryArgs {
      cookies: &cookies,
      bearer_token: &bearer_token,
      refresh_token: &refresh_token,
      individual_request_timeout: None,
      file: FileBytesOrPath::Bytes(file_bytes),
    }).await.unwrap();

    println!("Object ID: {}", results.run_id.0);
    println!("World ID: {}", results.world_id.0);
    println!("Upload URL: {}", results.image_upload_url);
    println!("Has new access tokens: {}", results.maybe_new_access_tokens.is_some());

    assert_eq!(1, 2);
  }


  #[tokio::test]
  #[ignore] // Client side tests only
  async fn test_requests_2() {
    setup_test_logging(LevelFilter::Debug);

    let cookies = get_typed_test_cookies().unwrap();
    let bearer_token = get_test_bearer_token().unwrap();
    let refresh_token = get_typed_test_refresh_token().unwrap();

    //let file_path = "/home/bt/Pictures/locations/island.jpg";
    let file_path = "/Users/bt/Pictures/Midjourney/train_ghibli.jpeg";
    let file_bytes = file_read_bytes(file_path).unwrap();

    println!("File bytes len: {}", file_bytes.len());

    let results = upload_image_and_create_world_with_retry(UploadImageAndCreateWorldWithRetryArgs {
      cookies: &cookies,
      bearer_token: &bearer_token,
      refresh_token: &refresh_token,
      individual_request_timeout: None,
      file: FileBytesOrPath::Bytes(file_bytes),
    }).await.unwrap();

    println!("Upload URL: {}", results.image_upload_url);
    println!("Object ID: {}", results.run_id.0);
  }
}
