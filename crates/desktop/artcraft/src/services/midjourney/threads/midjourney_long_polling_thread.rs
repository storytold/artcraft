use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::midjourney::threads::events::maybe_handle_text_to_image_complete_event::maybe_handle_text_to_image_complete_event;
use crate::services::midjourney::utils::download_midjourney_image::download_midjourney_image;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
use cookie_store::cookie_store::CookieStore;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use errors::AnyhowResult;
use uuid_utils::uuid::generate_random_uuid;
use log::{error, info};
use midjourney_client::client::midjourney_hostname::MidjourneyHostname;
use midjourney_client::credentials::midjourney_user_id::MidjourneyUserId;
use midjourney_client::endpoints::imagine::{imagine, ImagineItem, ImagineRequest, MidjourneyJobType};
use midjourney_client::utils::get_image_url::get_image_url;
use midjourney_client::utils::image_downloader_client::ImageDownloaderClient;
use once_cell::sync::Lazy;
use sqlite_tasks::queries::list_tasks_by_provider_and_status::{list_tasks_by_provider_and_status, ListTasksByProviderAndStatusArgs, TaskList};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_successful_task_status_with_metadata::{update_successful_task_status_with_metadata, UpdateSuccessfulTaskArgs};
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs};
use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use artcraft_client::error::api_error::ApiError;
use artcraft_client::error::storyteller_error::StorytellerError;
use tauri::AppHandle;
use tokens::tokens::batch_generations::BatchGenerationToken;
use url::Url;

/// This thread is responsible for picking up tasks that fell through the cracks of
/// the faster websocket thread.
pub async fn midjourney_long_polling_thread(
  app_handle: AppHandle,
  app_env_configs: AppEnvConfigs,
  app_data_root: AppDataRoot,
  task_database: TaskDatabase,
  creds: MidjourneyCredentialManager,
  storyteller_creds_manager: StorytellerCredentialManager,
) -> ! {
  loop {
    let res = polling_loop(
      &app_handle,
      &app_env_configs,
      &app_data_root,
      &task_database,
      &creds,
      &storyteller_creds_manager,
    ).await;
    if let Err(err) = res {
      error!("An error occurred: {:?}", err);
    }
    // NB: Only sleep if an error occurs.
    tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
  }
}

async fn polling_loop(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  creds: &MidjourneyCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {
  loop {
    if !creds.session_appears_active()? {
      tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
      continue;
    }

    // TODO: Graceful wait, fix this long function body
    let storyteller_creds = match storyteller_creds_manager.get_credentials()? {
      Some(creds) => creds,
      None => {
        error!("No Storyteller credentials found. Cannot proceed with Midjourney polling.");
        tokio::time::sleep(std::time::Duration::from_millis(5_000)).await;
        continue;
      }
    };

    let cookies = creds.maybe_copy_cookie_store()?;

    let cookies = match cookies {
      Some(cookies) => cookies,
      None => {
        tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
        continue;
      }
    };

    let user_info = creds.maybe_copy_user_info()?;

    let maybe_user_id = user_info
        .map(|info| info.user_id)
        .flatten();

    let user_id = match maybe_user_id {
      Some(user_id) => user_id,
      None => {
        tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
        continue;
      }
    };

    let local_tasks = list_tasks_by_provider_and_status(ListTasksByProviderAndStatusArgs {
      db: task_database.get_connection(),
      provider: GenerationProvider::Midjourney,
      task_statuses: &TASK_DATABASE_PENDING_STATUSES,
    }).await?;

    poll_midjourney_tasks(
      app_handle,
      app_env_configs,
      app_data_root,
      task_database,
      &cookies,
      &user_id,
      &storyteller_creds,
      local_tasks,
    ).await?;

    tokio::time::sleep(std::time::Duration::from_millis(2_000)).await;
  }
}

async fn poll_midjourney_tasks(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  mj_cookies: &CookieStore,
  mj_user_id: &MidjourneyUserId,
  storyteller_creds: &StorytellerCredentialSet,
  local_tasks: TaskList,
) -> AnyhowResult<()> {
  let local_tasks = local_tasks.tasks;

  if local_tasks.is_empty() {
    return Ok(())
  }

  // Map of Midjourney Job ID to Local Task.
  let local_tasks_by_midjourney_job_id = local_tasks.iter()
      .filter_map(|task| {
        if let Some(provider_job_id) = &task.provider_job_id {
          Some((provider_job_id.clone(), task.clone()))
        } else {
          None
        }
      })
      .collect::<HashMap<String, Task>>();

  let cookie_header = mj_cookies.to_cookie_string();

  let midjourney_result = imagine(ImagineRequest {
    hostname: MidjourneyHostname::Standard,
    cookie_header,
    user_id: mj_user_id,
    page_size: None,
  }).await?;

  let midjourney_items = midjourney_result.items;

  let midjourney_items_by_id = {
    let mut hash = HashMap::new();
    for item in midjourney_items.iter() {
      if let Some(id) = &item.id {
        hash.insert(id.to_string(), item.clone());
      }
    }
    hash
  };

  // TODO: If we introduce another job polling mechanism, we may need to handle concurrency.
  //  One idea might be to add a new job state that acts as an optimistic lock

  let image_downloader = ImageDownloaderClient::create()?;

  for (midjourney_job_id, local_task) in local_tasks_by_midjourney_job_id.iter() {
    // TODO: Copy prompt from this.
    let midjourney_item = match midjourney_items_by_id.get(midjourney_job_id) {
      Some(item) => item,
      None => continue,
    };

    upload_midjourney_batch(
      &app_handle,
      &app_env_configs,
      app_data_root,
      task_database,
      &storyteller_creds,
      &image_downloader,
      midjourney_job_id,
      &local_task,
      midjourney_item
    ).await?;

    tokio::time::sleep(std::time::Duration::from_millis(2_000)).await;
  }

  tokio::time::sleep(std::time::Duration::from_millis(60_000)).await;

  Ok(())
}

async fn upload_midjourney_batch(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  storyteller_creds: &StorytellerCredentialSet,
  image_downloader: &ImageDownloaderClient,
  midjourney_job_id: &String,
  local_task: &Task,
  midjourney_item: &ImagineItem
) -> AnyhowResult<()> {
  let model_type = match midjourney_item.job_type {
    Some(MidjourneyJobType::V6Diffusion) => CommonModelType::MidjourneyV6,
    Some(MidjourneyJobType::V6p1Diffusion) => CommonModelType::MidjourneyV6p1,
    Some(MidjourneyJobType::V6p1RawDiffusion) => CommonModelType::MidjourneyV6p1Raw,
    Some(MidjourneyJobType::V7Diffusion) => CommonModelType::MidjourneyV7,
    Some(MidjourneyJobType::V7RawDiffusion) => CommonModelType::MidjourneyV7Raw,
    Some(MidjourneyJobType::V7DraftDiffusion) => CommonModelType::MidjourneyV7Draft,
    Some(MidjourneyJobType::V7DraftRawDiffusion) => CommonModelType::MidjourneyV7DraftRaw,
    Some(MidjourneyJobType::Other(ref other)) => {
      info!("Unknown Midjourney job type (for job id {}): {}", midjourney_job_id, other);
      CommonModelType::Midjourney
    },
    _ => CommonModelType::Midjourney,
  };

  let request = CreatePromptRequest {
    uuid_idempotency_token: generate_random_uuid(),
    positive_prompt: midjourney_item.full_command.clone(),
    negative_prompt: None,
    model_type: Some(model_type),
    generation_provider: Some(GenerationProvider::Midjourney),
    maybe_generation_mode: None,
    maybe_aspect_ratio: None,
    maybe_resolution: None,
    maybe_batch_count: None,
    maybe_generate_audio: None,
  };

  let prompt_response = create_prompt(
    &app_env_configs.storyteller_host,
    Some(storyteller_creds),
    request
  ).await?;

  info!("Created prompt: {:?}", &prompt_response.prompt_token);

  // TODO: Move this from clientside to the backend.
  //  The first upload should produce a batch token that we can reuse.
  let batch_token = BatchGenerationToken::generate();

  info!("Using synthetic batch token: {:?}", &batch_token);

  let mut maybe_primary_media_file_token = None;

  for index in 0..4 {
    info!("Downloading generated Midjourney file...");

    let download_path = download_midjourney_image(
      &image_downloader,
      midjourney_job_id,
      index,
      app_data_root
    ).await?;

    let mut wait_delay = 0;

    loop {
      info!("Uploading to backend...");

      // TODO: media_files.origin_category
      // TODO: media_files.maybe_prompt_token
      // TODO: media_files.maybe_generation_provider
      // TODO: media_files.maybe_origin_model_type
      // TODO: media_files.maybe_origin_model_token (sref?)
      // TODO: media_files.is_batch_generated
      // TODO: media_files.maybe_batch_token
      // TODO: media_files.is_user_upload

      // TODO: batch_generations.token
      // TODO: batch_generations.entity_type
      // TODO: batch_generations.entity_token

      let result = upload_image_media_file_from_file(UploadImageFromFileArgs {
        api_host: &app_env_configs.storyteller_host,
        maybe_creds: Some(&storyteller_creds),
        path: &download_path,
        is_intermediate_system_file: false,
        maybe_prompt_token: Some(&prompt_response.prompt_token),
        maybe_batch_token: Some(&batch_token),
      }).await;

      match result {
        Ok(result) => {
          info!("Successfully uploaded to backend: {:?}", result.media_file_token);
          if maybe_primary_media_file_token.is_none() {
            maybe_primary_media_file_token = Some(result.media_file_token);
          }
          break;
        },
        Err(StorytellerError::Api(ApiError::TooManyRequests(_))) => {
          error!("Too many requests, retrying upload after delay...");
          // If we hit a rate limit, we can retry after a short delay.
          wait_delay += 10;
          if wait_delay > 60 {
            wait_delay = 60;
          }
          tokio::time::sleep(std::time::Duration::from_secs(wait_delay)).await;
          continue; // Retry the upload.
        }
        Err(err) => {
          error!("Failed to upload to backend: {:?}", err);
          return Err(err.into())
        },
      }
    } // End loop

    tokio::time::sleep(std::time::Duration::from_millis(100)).await;
  }

  let mut maybe_cdn_url = None;
  let mut maybe_thumbnail_url_template = None;

  if let Some(media_file_token) = maybe_primary_media_file_token.as_ref() {
    info!("Looking up file to grab CDN and thumbnail URLs: {:?} ...", media_file_token);

    let lookup_result = get_media_file(
      &app_env_configs.storyteller_host,
      media_file_token,
    ).await;
    match lookup_result {
      Ok(response) => {
        maybe_cdn_url = Some(response.media_file.media_links.cdn_url.to_string());
        maybe_thumbnail_url_template = media_links_to_thumbnail_template(&response.media_file.media_links)
            .map(|s| s.to_string());
      }
      Err(err) => {
        error!("Failed to look up media file after upload: {:?} (failing open)", err);
      }
    }
  }

  let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs {
    db: task_database.get_connection(),
    task_id: &local_task.id,
    maybe_batch_token: Some(&batch_token),
    maybe_primary_media_file_token: maybe_primary_media_file_token.as_ref(),
    maybe_primary_media_file_class: Some(TaskMediaFileClass::Image),
    maybe_primary_media_file_thumbnail_url_template: maybe_thumbnail_url_template.as_deref(),
    maybe_primary_media_file_cdn_url: maybe_cdn_url.as_deref(),
  }).await?;

  if !updated {
    return Ok(()); // If anything breaks with queries, don't spam events.
  }

  let event = GenerationCompleteEvent {
    //media_file_token: result.media_file_token,
    action: Some(GenerationAction::GenerateImage),
    service: GenerationServiceProvider::Midjourney,
    model: None,
  };

  if let Err(err) = event.send(&app_handle) {
    error!("Failed to send GenerationCompleteEvent: {:?}", err); // Fail open
  }

  let result = maybe_handle_text_to_image_complete_event(
    app_handle,
    app_env_configs,
    Some(storyteller_creds),
    local_task,
    &batch_token,
  ).await;

  if let Err(err) = result {
    error!("Failed to send text-to-image complete event: {:?}", err);
  }

  Ok(())
}

