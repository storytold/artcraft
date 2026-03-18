use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::image_to_gaussian::enqueue_image_to_gaussian_command::EnqueueImageToGaussianRequest;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::events::functional_events::show_provider_login_modal_event::ShowProviderLoginModalEvent;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::simple_http_download::simple_http_download;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::worldlabs::state::worldlabs_credential_manager::WorldlabsCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use uuid_utils::uuid::generate_random_uuid;
use log::{error, info};
use std::path::PathBuf;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use tauri::AppHandle;
use tokens::tokens::media_files::MediaFileToken;
use worldlabs_consumer_client::credentials::world_labs_cookies::WorldLabsCookies;
use worldlabs_consumer_client::recipes::upload_image_and_create_world_with_retry::{upload_image_and_create_world_with_retry, FileBytesOrPath, UploadImageAndCreateWorldWithRetryArgs};

pub(super) const MAX_IMAGES: usize = 10;

pub async fn handle_worldlabs_marble(
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  request: &EnqueueImageToGaussianRequest,
  worldlabs_creds_manager: &WorldlabsCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let world_labs_cookies = match worldlabs_creds_manager.maybe_copy_typed_cookies()? {
    Some(cookies) => cookies,
    None => {
      error!("No WorldLabs cookies!");
      ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::WorldLabs, &app);
      return Err(GenerateError::needs_worldlabs_credentials());
    }
  };

  let world_labs_bearer = match worldlabs_creds_manager.maybe_copy_bearer_token()? {
    Some(bearer) => bearer,
    None => {
      error!("No WorldLabs bearer token!");
      ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::WorldLabs, &app);
      return Err(GenerateError::needs_worldlabs_credentials());
    }
  };

  let world_labs_refresh = match worldlabs_creds_manager.maybe_copy_refresh_token()? {
    Some(bearer) => bearer,
    None => {
      error!("No WorldLabs refresh token!");
      ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::WorldLabs, &app);
      return Err(GenerateError::needs_worldlabs_credentials());
    }
  };

  let maybe_prompt = request.prompt
      .as_deref()
      .map(|prompt| prompt.trim().to_string());

  info!("Downloading image file...");

  let file_path = download_file(
    app_data_root,
    app_env_configs,
    request,
  ).await?;

  info!("Enqueueing WorldLabs request...");

  let response = upload_image_and_create_world_with_retry(UploadImageAndCreateWorldWithRetryArgs {
    cookies: &world_labs_cookies,
    bearer_token: &world_labs_bearer,
    refresh_token: &world_labs_refresh,
    individual_request_timeout: None,
    file: FileBytesOrPath::Path(file_path),
  }).await?;

  let run_id = response.run_id;
  let world_id = response.world_id;

  info!("Run ID: {:?}", run_id);
  info!("World ID: {:?}", world_id);
  
  if let Some(new_access) = response.maybe_new_access_tokens {
    info!("New access tokens were generated; saving.");
    worldlabs_creds_manager.replace_bearer_and_refresh_token(
      new_access.bearer_token,
      new_access.refresh_token
    )?;

    worldlabs_creds_manager.persist_to_disk()?;
  }

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::WorldLabs,
    model: Some(GenerationModel::WorldlabsMarble),
    provider_job_id: Some(world_id.0),
    task_type: TaskType::ImageGeneration,
  })
}

async fn download_file(
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  request: &EnqueueImageToGaussianRequest,
) -> Result<PathBuf, GenerateError> {

  let maybe_media_token = request.image_media_tokens
      .as_ref()
      .and_then(|tokens| tokens.get(0));

  let media_token = match maybe_media_token {
    Some(token) => token,
    None => {
      return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfInputImages {
        min: 1,
        max: MAX_IMAGES as u32,
        provided: 0,
      }));
    }
  };

  info!("Calling get media file API: {:?}", app_env_configs.storyteller_host);

  // TODO(bt,2025-12-18): Add a cache.
  info!("Using media token: {:?}", media_token);

  let response = get_media_file(
    &app_env_configs.storyteller_host,
    media_token
  ).await?;

  let media_file_url = &response.media_file.media_links.cdn_url;
  let extension_with_dot = get_url_file_extension(media_file_url)
      .map(|ext| format!(".{}", ext))
      .unwrap_or_else(|| ".png".to_string());

  let filename = format!("{}{}", response.media_file.token.as_str(), extension_with_dot);
  let filename = app_data_root.downloads_dir().path().join(&filename);

  simple_http_download(&media_file_url, &filename).await?;

  Ok(filename)
}

//async fn download_files(
//  app_data_root: &AppDataRoot,
//  app_env_configs: &AppEnvConfigs,
//  request: &EnqueueImageToGaussianRequest,
//) -> Result<Vec<PathBuf>, GenerateError> {
//
//  let maybe_media_token = request.image_media_tokens
//      .as_ref()
//      .and_then(|tokens| tokens.get(0));
//
//
//  let media_tokens = match request.image_media_tokens.as_ref() {
//    Some(media_tokens) => media_tokens.to_vec(),
//    None => {
//      return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfInputImages {
//        min: 1,
//        max: MAX_IMAGES as u32,
//        provided: 0,
//      }));
//    }
//  };
//
//  if media_tokens.len() > MAX_IMAGES {
//    return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfInputImages {
//      min: 1,
//      max: MAX_IMAGES as u32,
//      provided: media_tokens.len() as u32,
//    }));
//  }
//
//  info!("Calling get media file API: {:?}", app_env_configs.storyteller_host);
//
//  let mut local_files_to_upload = Vec::with_capacity(10);
//
//  // TODO(bt,2025-07-07): This is inefficient. Cache and parallelize this.
//  // TODO(bt,2025-12-18): Add a cache.
//  for media_token in media_tokens.iter() {
//    info!("Using media token: {:?}", media_token);
//
//    let response = get_media_file(
//      &app_env_configs.storyteller_host,
//      media_token
//    ).await?;
//
//    let media_file_url = &response.media_file.media_links.cdn_url;
//    let extension_with_dot = get_url_file_extension(media_file_url)
//        .map(|ext| format!(".{}", ext))
//        .unwrap_or_else(|| ".png".to_string());
//
//    let filename = format!("{}{}", response.media_file.token.as_str(), extension_with_dot);
//    let filename = app_data_root.downloads_dir().path().join(&filename);
//
//    simple_http_download(&media_file_url, &filename).await?;
//
//    local_files_to_upload.push(filename);
//  }
//
//  Ok(local_files_to_upload)
//}

// TODO:
// fn handle_midjourney_errors(
//   app: &AppHandle,
//   maybe_errors: Option<Vec<TextToImageError>>
// ) -> Result<TaskEnqueueSuccess, GenerateError> {
//   if let Some(errors) = maybe_errors {
//     if !errors.is_empty() {
//       let messages: Vec<String> = errors.iter()
//           .map(|e| format!("{:?}", e))
//           .collect();
//
//       let combined_message = messages.join("; ");
//
//       let event = FlashUserInputErrorEvent {
//         message: format!("Midjourney Error: {}", combined_message),
//       };
//
//       if let Err(err) = event.send(&app) {
//         error!("Failed to send FlashUserInputErrorEvent: {:?}", err); // Fail open
//       }
//     }
//   }
//
//   Err(GenerateError::ProviderFailure(ProviderFailureReason::MidjourneyJobEnqueueFailed))
// }
